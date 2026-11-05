# -*- coding: utf-8 -*-
"""热门歌曲榜单测试：归一化、名次趋势、排名代理热度、服务编排、路由。"""
import csv
import io

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import music_chart as music_chart_router
from app.services import music_chart as mc


@pytest.fixture
def mc_env(monkeypatch, tmp_path):
    """把榜单存储指到 tmp，返回干净的服务实例。"""
    monkeypatch.setattr(mc, "MUSIC_CHART_DIR", tmp_path / "music_chart")
    monkeypatch.setattr(mc, "MUSIC_CHART_SNAPSHOTS_DIR", tmp_path / "music_chart" / "snapshots")
    return tmp_path


@pytest.fixture
def svc(mc_env):
    return mc.MusicChartService()


def _song(title, artist="歌手", album="专辑", duration=200, url="", raw_hot=""):
    return {
        "title": title,
        "artist": artist,
        "album": album,
        "duration": duration,
        "cover": "",
        "url": url,
        "raw_hot": raw_hot,
        "time_public": "",
    }


def _fake_fetch_all_factory(order_a, order_b):
    """返回一个可被多轮刷新调用的 fetch_all 假实现（每榜两个榜单）。"""

    def fake(boards=None):
        meta = {
            "name": "x",
            "period": "2026_44",
            "update_time": "2026-10-29",
            "update_tips": "每周更新",
            "intro": "",
            "listen_num": 100,
            "cover": "",
            "source": "QQ音乐",
        }
        return {
            "dy_hot": ([_song(t) for t in order_a], meta),
            "rise": ([_song(t) for t in order_b], dict(meta, period="2026-11-02")),
        }

    return fake


# ---- 归一化与工具 ----


def test_normalize_text():
    assert mc.normalize_text("  告白气球 （Live） ") == "告白气球(live)"


def test_item_id_stable():
    assert mc.item_id("dy_hot", "告白 气球", "周杰伦") == mc.item_id("dy_hot", "告白气球", "周杰伦")
    assert mc.item_id("dy_hot", "x") != mc.item_id("rise", "x")


def test_rank_hot():
    assert mc.rank_hot(1, 100) == 100.0
    assert mc.rank_hot(100, 100) == 30.0
    assert mc.rank_hot(5, 5) == 30.0
    assert mc.rank_hot(1, 1) == 100.0


def test_compute_rank_trend():
    assert mc.compute_rank_trend(None, 3) == ("new", 0)
    assert mc.compute_rank_trend(8, 2) == ("up", 6)
    assert mc.compute_rank_trend(2, 9) == ("down", -7)
    assert mc.compute_rank_trend(4, 5) == ("flat", -1)
    assert mc.compute_rank_trend(4, 2) == ("flat", 2)  # 阈值内不算上升


# ---- 服务编排 ----


def test_refresh_builds_items(svc, monkeypatch):
    fake = _fake_fetch_all_factory(["A", "B", "C"], ["X", "Y"])
    monkeypatch.setattr(mc.sources, "fetch_all", fake)
    result = svc.refresh()

    # items = 抓取 5 + 合成榜 bgm_hot 5 + 合成榜 dy_bgm 3 + 自定义 0
    assert result["items"] == 13
    boards = {b["id"]: b for b in result["boards"]}
    assert boards["dy_hot"]["ok"] is True
    assert boards["dy_hot"]["count"] == 3
    assert boards["dy_hot"]["period"] == "2026_44"
    assert boards["rise"]["ok"] is True
    assert boards["bgm_hot"]["ok"] is True
    assert boards["dy_bgm"]["ok"] is True
    assert boards["dy_bgm"]["group"] == "抖音"
    assert boards["vibe"]["ok"] is True  # 预置「Vibe 知识大赏 BGM」自动创建

    items = svc.get_items(board="dy_hot")
    assert [i.rank for i in items] == [1, 2, 3]
    assert items[0].trend == "new"
    assert items[0].search_url  # 抖音搜索链接已生成
    assert items[0].hot == 100.0

    # 落盘可恢复
    snap = svc.store.load_latest_snapshot()
    assert snap is not None
    boards, snap_items = snap
    assert len(boards) == len(mc.sources.QQ_BOARDS) + 3  # 全部榜单 + 两个合成榜 + 自定义榜
    assert sum(1 for b in boards if b.ok) == 5
    assert len(snap_items) == 13


def test_refresh_second_round_trends(svc, monkeypatch):
    monkeypatch.setattr(mc.sources, "fetch_all", _fake_fetch_all_factory(["A", "B", "C", "D", "E", "F"], []))
    svc.refresh()

    monkeypatch.setattr(
        mc.sources, "fetch_all", _fake_fetch_all_factory(["E", "D", "C", "B", "A", "G"], [])
    )
    svc.refresh()

    by_title = {i.title: i for i in svc.get_items(board="dy_hot")}
    assert by_title["E"].trend == "up" and by_title["E"].rank_diff == 4
    assert by_title["A"].trend == "down" and by_title["A"].rank_diff == -4
    assert by_title["C"].trend == "flat" and by_title["C"].rank_diff == 0
    assert by_title["D"].trend == "flat" and by_title["D"].rank_diff == 2
    assert by_title["G"].trend == "new"
    assert "F" not in by_title  # 掉榜不出现在最新快照
    # 历史名次被保留
    assert by_title["A"].history == [1, 5]


def test_get_items_filters(svc, monkeypatch):
    monkeypatch.setattr(mc.sources, "fetch_all", _fake_fetch_all_factory(["晴天", "七里香"], ["稻香"]))
    svc.refresh()

    # 抓取 3 + 合成 bgm_hot 3 + 合成 dy_bgm 2 + 自定义 0
    assert len(svc.get_items()) == 8
    assert all(i.board == "rise" for i in svc.get_items(board="rise"))
    # 全局搜索会命中同名歌曲的多个榜（两个合成榜 + 原榜）
    assert [(i.board, i.title) for i in svc.get_items(q="里香")] == [
        ("bgm_hot", "七里香"),
        ("dy_bgm", "七里香"),
        ("dy_hot", "七里香"),
    ]
    # trend 排序：新上榜优先
    ordered = svc.get_items(sort="trend")
    assert ordered[0].trend == "new"


def test_refresh_partial_failure(svc, monkeypatch):
    def flaky(boards=None):
        meta = {"source": "QQ音乐", "period": "p", "update_time": "", "update_tips": "", "intro": "", "listen_num": 0}
        return {
            "dy_hot": ([_song("A")], meta),
            "rise": ([], {}),  # 该榜失败（未出现在结果里也等价于空）
        }

    monkeypatch.setattr(mc.sources, "fetch_all", flaky)
    result = svc.refresh()
    boards = {b["id"]: b for b in result["boards"]}
    assert boards["dy_hot"]["ok"] is True
    assert boards["rise"]["ok"] is False
    assert boards["rise"]["error"]


# ---- 路由 ----


@pytest.fixture
def client(mc_env, monkeypatch):
    # 单例服务的内存态直接注入，模拟已完成一轮刷新
    monkeypatch.setattr(mc.sources, "fetch_all", _fake_fetch_all_factory(["A", "B"], ["C"]))
    mc.service.refresh()
    app = FastAPI()
    app.include_router(music_chart_router.router)
    return TestClient(app)


def test_router_status_and_boards(client):
    r = client.get("/api/music-chart/status")
    assert r.status_code == 200
    body = r.json()
    # 抓取 3 + bgm_hot 并集 3 + dy_bgm 2
    assert body["song_count"] == 8
    assert body["boards_ok"] == 5  # dy_hot / rise / bgm_hot / dy_bgm / vibe

    r = client.get("/api/music-chart/boards")
    assert r.status_code == 200
    boards = {b["id"]: b for b in r.json()}
    assert boards["dy_hot"]["name"]
    assert boards["bgm_hot"]["group"] == "推荐"
    assert boards["dy_bgm"]["group"] == "抖音"
    assert boards["vibe"]["group"] == "我的榜单"
    assert boards["vibe"]["name"] == "Vibe 知识大赏 BGM"


def test_router_items_and_refresh(client, monkeypatch):
    r = client.get("/api/music-chart/items?board=dy_hot")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 2
    assert items[0]["rank"] == 1

    r = client.get("/api/music-chart/items?q=C")
    # C 仅在飙升榜：bgm_hot 权重含 rise，dy_bgm（抖音生态三源）不含
    assert sorted((i["board"], i["title"]) for i in r.json()) == [
        ("bgm_hot", "C"),
        ("rise", "C"),
    ]

    monkeypatch.setattr(mc.sources, "fetch_all", _fake_fetch_all_factory(["A", "B", "Z"], ["C"]))
    r = client.post("/api/music-chart/refresh", json={"boards": []})
    assert r.status_code == 200
    # 抓取 4 + bgm_hot 4 + dy_bgm 3
    assert r.json()["items"] == 11

    r = client.get("/api/music-chart/items?q=Z")
    assert sorted(i["board"] for i in r.json()) == ["bgm_hot", "dy_bgm", "dy_hot"]


def test_router_export_csv(client):
    r = client.get("/api/music-chart/export.csv")
    assert r.status_code == 200
    text = r.content.decode("utf-8-sig")
    rows = list(csv.reader(io.StringIO(text)))
    assert rows[0][0] == "榜单"
    assert any(row[2] == "A" for row in rows[1:])


# ---- 最热BGM合成榜 ----


def test_bgm_hot_composite(svc, monkeypatch):
    """跨榜共鸣：命中榜越多、名次越靠前，综合排名越高。"""

    def fake(boards=None):
        meta = {"source": "QQ音乐", "period": "p", "update_time": "2026-11-02", "update_tips": "", "intro": "", "listen_num": 0}
        return {
            "dy_hot": ([_song("共鸣歌", "歌手甲"), _song("独唱歌", "歌手乙")], meta),
            "song_recog": ([_song("共鸣歌", "歌手甲"), _song("识曲歌", "歌手丙")], dict(meta, period="p2")),
            "rise": ([], dict(meta, period="p3")),
        }

    monkeypatch.setattr(mc.sources, "fetch_all", fake)
    svc.refresh()

    bgm = svc.get_items(board="bgm_hot")
    assert [i.title for i in bgm][:2] == ["共鸣歌", "独唱歌"] or [i.title for i in bgm][:2] == ["共鸣歌", "识曲歌"]
    top = bgm[0]
    assert top.title == "共鸣歌"  # 双榜命中且均列第一 → 综合分最高
    assert set(top.from_boards) == {"dy_hot", "song_recog"}
    assert top.rank == 1

    boards = {b.id: b for b in svc.boards()}
    assert boards["bgm_hot"].count == 3  # 共鸣歌/独唱歌/识曲歌 去重后 3 首


# ---- 自定义策展榜（我的榜单） ----


def test_custom_board_crud(svc, monkeypatch):
    monkeypatch.setattr(mc.sources, "fetch_all", _fake_fetch_all_factory(["A"], []))
    svc.refresh()

    # 预置 Vibe 榜自动存在
    names = [b.name for b in svc.custom_boards()]
    assert "Vibe 知识大赏 BGM" in names

    cb = svc.create_custom_board("测试榜", "测试用")
    board, added = svc.add_custom_item(cb.id, {"title": "晴天", "artist": "周杰伦", "album": "叶惠美"})
    assert added is True
    board, added = svc.add_custom_item(cb.id, {"title": "晴天", "artist": "周杰伦"})
    assert added is False  # 同歌同歌手去重

    items = svc.get_items(board=cb.id)
    assert [i.title for i in items] == ["晴天"]
    assert items[0].search_url  # 抖音搜索链接

    assert svc.remove_custom_item(cb.id, "晴天", "周杰伦") is True
    assert svc.get_items(board=cb.id) == []
    assert svc.delete_custom_board(cb.id) is True

    try:
        svc.create_custom_board("Vibe 知识大赏 BGM")
        raise AssertionError("should raise ValueError")
    except ValueError:
        pass


def test_custom_board_router(client):
    r = client.post("/api/music-chart/custom-boards", json={"name": "我的私藏", "desc": "d"})
    assert r.status_code == 200
    bid = r.json()["id"]

    r = client.post(f"/api/music-chart/custom-boards/{bid}/items", json={"title": "晴天", "artist": "周杰伦"})
    assert r.status_code == 200
    assert r.json()["added"] is True

    r = client.get("/api/music-chart/items?board=" + bid)
    assert [i["title"] for i in r.json()] == ["晴天"]

    r = client.delete(f"/api/music-chart/custom-boards/{bid}/items?title=%E6%99%B4%E5%A4%A9&artist=%E5%91%A8%E6%9D%B0%E4%BC%A6")
    assert r.status_code == 200

    r = client.delete(f"/api/music-chart/custom-boards/{bid}")
    assert r.status_code == 200

    # 删除后可重建同名榜；重复创建返回 409
    r = client.post("/api/music-chart/custom-boards", json={"name": "我的私藏"})
    assert r.status_code == 200
    r = client.post("/api/music-chart/custom-boards", json={"name": "我的私藏"})
    assert r.status_code == 409
