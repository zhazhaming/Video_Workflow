# -*- coding: utf-8 -*-
"""热点雷达测试：归一化、趋势与第一波指数、方向匹配、源解析、服务编排、路由。"""
import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import hotspot as hotspot_router
from app.services import hotspot as hs
from app.services import hotspot_sources as sources
from app.services import llm


@pytest.fixture
def hs_env(monkeypatch, tmp_path):
    """把热点存储指到 tmp，返回一个干净的服务实例。"""
    monkeypatch.setattr(hs, "HOTSPOT_DIR", tmp_path / "hotspot")
    monkeypatch.setattr(hs, "HOTSPOT_SNAPSHOTS_DIR", tmp_path / "hotspot" / "snapshots")
    return tmp_path


@pytest.fixture
def svc(hs_env):
    s = hs.HotspotService()
    return s


def _raw(title, hot=None, tag="", url=""):
    return {"title": title, "url": url, "hot": hot, "raw_hot": "", "tag": tag, "summary": ""}


# ---- 归一化 ----


def test_normalize_title():
    assert hs.normalize_title("  AI 大模型来了！ ") == "ai大模型来了!"
    assert hs.normalize_title("（重磅）AI芯片") == "(重磅)ai芯片"


def test_item_id_stable():
    assert hs.item_id("douyin", "AI 大模型！") == hs.item_id("douyin", "AI大模型!")
    assert hs.item_id("douyin", "x") != hs.item_id("baidu", "x")


def test_scale_platform_numeric():
    vals = hs._scale_platform([1000000.0, 10000.0, 100.0, None])
    assert vals[0] == 100.0
    assert vals[1] < 90 and vals[1] > 60
    assert vals[3] == 0.0


def test_normalize_hot_rank_proxy():
    assert hs.normalize_hot(None, 1, 50) == 100.0
    assert hs.normalize_hot(None, 50, 50) == 30.0
    assert hs.normalize_hot(None, 5, 5) == 30.0
    assert hs.normalize_hot(None, 1, 1) == 100.0


# ---- 趋势与第一波指数 ----


def test_compute_trend():
    assert hs.compute_trend(None, 50)[0] == "new"
    assert hs.compute_trend(50, 80) == ("up", 60.0)
    assert hs.compute_trend(80, 40)[0] == "down"
    assert hs.compute_trend(80, 79)[0] == "flat"
    assert hs.compute_trend(80, 84.7)[0] == "flat"  # 6% 阈值内
    assert hs.compute_trend(0, 50)[0] == "new"  # 上一轮无数值视为新出现


def _iso_now():
    return hs._iso(hs._now())


def test_compute_burst_ordering():
    now = _iso_now()
    burst_new = hs.compute_burst("new", 90, now, False)
    burst_flat = hs.compute_burst("flat", 90, now, False)
    burst_down = hs.compute_burst("down", 90, now, False)
    assert burst_new > burst_flat > burst_down
    # 新鲜度：半小时内 > 一天前的霸榜热点
    old = hs._iso(hs._now() - hs.timedelta(days=2))
    assert hs.compute_burst("flat", 90, now, False) > hs.compute_burst("flat", 90, old, False)
    # 跨平台共振加成
    assert hs.compute_burst("flat", 90, now, True) > hs.compute_burst("flat", 90, now, False)
    # 夹在 0~100
    assert hs.compute_burst("new", 100, now, True) <= 100.0
    assert hs.compute_burst("down", 0, old, False) >= 0.0


# ---- 方向匹配 ----


def test_match_directions(svc):
    d1 = hs.HotDirection(id="d1", name="AI科技", keywords=["ai", "芯片"], exclude=["手机"])
    d2 = hs.HotDirection(id="d2", name="游戏", keywords=["游戏"], exclude=[])
    item = hs.HotItem(id="x", platform="douyin", title="新AI芯片发布")
    hs.match_directions(item, [d1, d2])
    assert item.direction_ids == ["d1"]
    assert "ai" in item.match_keywords

    item2 = hs.HotItem(id="y", platform="douyin", title="新AI手机发布")
    hs.match_directions(item2, [d1, d2])
    assert item2.direction_ids == []  # 命中排除词

    d1.enabled = False
    item3 = hs.HotItem(id="z", platform="douyin", title="新AI芯片发布")
    hs.match_directions(item3, [d1, d2])
    assert item3.direction_ids == []


# ---- 源解析器（fixture 响应） ----


class _FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class _FakeClient:
    def __init__(self, payload):
        self._payload = payload

    def get(self, *a, **kw):
        return _FakeResp(self._payload)


def test_parse_douyin():
    payload = {"word_list": [
        {"word": " 热点A ", "hot_value": 12345678, "label": 4},
        {"word": "", "hot_value": 1, "label": 0},
        {"word": "热点B", "hot_value": 100, "label": 2},
    ]}
    items = sources.fetch_douyin(_FakeClient(payload))
    assert [i["title"] for i in items] == ["热点A", "热点B"]
    assert items[0]["tag"] == "爆"
    assert items[0]["raw_hot"] == "1235万"


def test_parse_baidu_nested():
    payload = {"data": {"cards": [{"content": [
        {"content": [
            {"word": "百度热点1", "url": "https://m.baidu.com/x", "hotTag": "3", "index": 0, "isTop": True},
            {"word": "百度热点2", "url": "", "hotTag": "0", "index": 1},
        ]},
    ]}]}}
    items = sources.fetch_baidu(_FakeClient(payload))
    assert [i["title"] for i in items] == ["百度热点1", "百度热点2"]
    assert items[0]["tag"] == "沸"
    assert items[0]["hot"] is None  # 无数值 → 服务层用排名代理


def test_parse_toutiao():
    payload = {"data": [
        {"Title": "头条热点", "HotValue": 9876543, "LabelDesc": "热", "Url": "https://t.cn/1"},
        {"Title": "", "HotValue": 1},
    ]}
    items = sources.fetch_toutiao(_FakeClient(payload))
    assert len(items) == 1
    assert items[0]["title"] == "头条热点"
    assert items[0]["raw_hot"] == "988万"


def test_parse_zhihu():
    payload = {"data": [
        {"target": {"title": "知乎热点", "url": "https://api.zhihu.com/questions/123",
                    "excerpt": "  内容\n摘要 "}, "detail_text": "432 万热度"},
    ]}
    items = sources.fetch_zhihu(_FakeClient(payload))
    assert items[0]["title"] == "知乎热点"
    assert items[0]["url"] == "https://www.zhihu.com/question/123"
    assert items[0]["hot"] == 4320000.0
    assert items[0]["summary"] == "内容 摘要"


def test_parse_bilibili():
    payload = {"list": [
        {"keyword": "k1", "show_name": "B站热词", "score": 0.0},
        {"keyword": "k2", "show_name": "", "score": 99},
    ]}
    items = sources.fetch_bilibili(_FakeClient(payload))
    assert len(items) == 2
    assert items[0]["title"] == "B站热词"
    assert items[0]["hot"] is None  # score=0 → 无数值


# ---- 服务编排（两轮抓取 → 趋势/共振/方向/筛选） ----


def test_service_refresh_two_rounds(svc, monkeypatch):
    monkeypatch.setattr(hs, "PRESET_DIRECTIONS", [
        {"name": "AI科技", "keywords": ["AI"], "exclude": []},
    ])
    rounds = [
        {  # 第一轮
            "douyin": [_raw("AI大模型发布", hot=1000000), _raw("普通热点", hot=500000)],
            "baidu": [_raw("AI大模型发布"), _raw("百度独家")],
        },
        {  # 第二轮：AI大模型热度涨（共振），普通热点热度跌
            "douyin": [_raw("AI大模型发布", hot=9000000), _raw("普通热点", hot=10000), _raw("新上榜", hot=800000)],
            "baidu": [_raw("AI大模型发布")],
        },
    ]
    calls = {"n": 0}

    def fake_fetch_all(platforms=None):
        r = rounds[min(calls["n"], len(rounds) - 1)]
        calls["n"] += 1
        return r

    monkeypatch.setattr(sources, "fetch_all", fake_fetch_all)

    r1 = svc.refresh()
    assert r1["items"] == 4
    by_title1 = {i.title: i for i in svc._latest}
    assert by_title1["AI大模型发布"].trend == "new"
    assert by_title1["AI大模型发布"].cross_platform is True
    assert set(by_title1["AI大模型发布"].platforms) == {"douyin", "baidu"}
    assert by_title1["AI大模型发布"].direction_ids  # 命中 AI 方向
    # 百度无数值 → 排名代理：榜首 100、末位 30
    assert by_title1["百度独家"].hot == 30.0
    baidu_copy = [i for i in svc._latest if i.platform == "baidu" and i.title == "AI大模型发布"]
    assert baidu_copy[0].hot == 100.0

    r2 = svc.refresh()
    assert r2["items"] == 4
    # 同名热点在多平台各有一条，按平台取副本判断趋势
    ai2 = next(i for i in svc._latest if i.title == "AI大模型发布" and i.platform == "douyin")
    normal2 = next(i for i in svc._latest if i.title == "普通热点")
    assert ai2.trend == "up"
    assert ai2.trend_delta == 800.0  # 100万 → 900万
    assert ai2.history == [100.0, 100.0]  # 两轮都居榜首 → sparkline 数据
    assert normal2.trend == "down"
    assert next(i for i in svc._latest if i.title == "新上榜").trend == "new"
    # burst 排序：新上榜 + 共振的 AI 热点在前列
    assert svc._latest[0].burst >= svc._latest[-1].burst

    # 筛选
    assert {i.title for i in svc.get_items(platform="baidu")} == {"AI大模型发布"}
    assert len(svc.get_items(q="ai")) >= 1
    fresh = svc.get_items(sort="fresh")
    assert fresh[0].last_seen >= fresh[-1].last_seen
    unclassified = svc.get_items(direction_id="__none__")
    assert all(not i.direction_ids for i in unclassified)
    assert "新上榜" in {i.title for i in unclassified}

    # 快照已落盘且可恢复
    assert svc.store.load_latest_snapshot() is not None


def test_service_directions_persist(svc):
    ds = svc.store.load_directions()
    assert len(ds) == len(hs.PRESET_DIRECTIONS)  # 首次自动播种预设方向
    ds.append(hs.HotDirection(id="zz", name="自定义", keywords=["自定义词"]))
    svc.store.save_directions(ds)
    assert svc.store.load_directions()[-1].name == "自定义"


def test_state_backup_and_fallback(svc):
    # 第二次写入时，第一份被留作 .bak
    svc.store.save_state({"v": 1})
    svc.store.save_state({"v": 2})
    bak = hs.HOTSPOT_DIR / "state.json.bak"
    assert bak.exists()
    assert json.loads(bak.read_text(encoding="utf-8"))["v"] == 1
    assert svc.store.load_state()["v"] == 2
    # state.json 损坏 → 回退 bak
    (hs.HOTSPOT_DIR / "state.json").write_text("{broken", encoding="utf-8")
    assert svc.store.load_state()["v"] == 1


# ---- 路由 ----


@pytest.fixture
def client(monkeypatch, hs_env):
    # 独立 app，不触发 main.py 的 startup（避免真实抓取）
    app = FastAPI()
    app.include_router(hotspot_router.router)
    items = [
        hs.HotItem(id="a1", platform="douyin", title="AI热点", burst=88, hot=90,
                   direction_ids=["d1"], first_seen=_iso_now(), last_seen=_iso_now()),
        hs.HotItem(id="a2", platform="baidu", title="民生热点", burst=50, hot=40,
                   first_seen=_iso_now(), last_seen=_iso_now()),
    ]
    monkeypatch.setattr(hs.service, "_latest", items)
    monkeypatch.setattr(hs.service, "_state", {
        "last_refresh": _iso_now(), "last_error": "",
        "sources": {"douyin": {"platform": "douyin", "name": "抖音", "ok": True,
                               "count": 1, "error": "", "fetched_at": _iso_now()}},
    })
    # 方向存储走 tmp 真实文件（不 mock，顺带验证持久化）
    monkeypatch.setattr(hs.service, "refresh", lambda platforms=None: {"refreshed_at": _iso_now()})
    monkeypatch.setattr(llm, "generate_hotspot_topics",
                        lambda hot_items, count, model_id, hint="": [
                            {"title": "选题1", "angle": "角度", "hook": "钩子",
                             "why": "理由", "ref": hot_items[0]["title"]}]
                        )
    return TestClient(app)


def test_route_status(client):
    r = client.get("/api/hotspot/status")
    assert r.status_code == 200
    body = r.json()
    assert body["item_count"] == 2
    assert body["sources"][0]["ok"] is True


def test_route_items_filters(client):
    assert client.get("/api/hotspot/items").json()[0]["id"] == "a1"  # 默认 burst 排序
    assert client.get("/api/hotspot/items", params={"platform": "baidu"}).json()[0]["id"] == "a2"
    assert client.get("/api/hotspot/items", params={"direction_id": "d1"}).json()[0]["id"] == "a1"
    assert client.get("/api/hotspot/items", params={"q": "民生"}).json()[0]["id"] == "a2"
    assert client.get("/api/hotspot/items", params={"sort": "hot"}).json()[0]["id"] == "a1"


def test_route_refresh(client):
    r = client.post("/api/hotspot/refresh", json={"sources": []})
    assert r.status_code == 200
    assert "refreshed_at" in r.json()


def test_route_directions_crud(client):
    created = client.post("/api/hotspot/directions",
                          json={"name": "财经", "keywords": ["股市"]}).json()
    assert created["id"]
    assert client.post("/api/hotspot/directions", json={"name": "财经"}).status_code == 409
    updated = client.put(f"/api/hotspot/directions/{created['id']}",
                         json={"name": "财经", "keywords": ["股市", "基金"]}).json()
    assert "基金" in updated["keywords"]
    assert client.delete(f"/api/hotspot/directions/{created['id']}").status_code == 200
    assert client.delete(f"/api/hotspot/directions/{created['id']}").status_code == 404


def test_route_ai_topics(client):
    r = client.post("/api/hotspot/ai-topics", json={"item_ids": ["a1"], "count": 2})
    assert r.status_code == 200
    body = r.json()
    assert body["topics"][0]["ref"] == "AI热点"
    assert len(body["saved"]) >= 1  # 生成即落库
    assert "AI热点" in body["ref_counts"] or body["ref_counts"]
    # 落库后可查
    topics = client.get("/api/hotspot/topics").json()
    assert any(t["title"] == "选题1" for t in topics)
    # 状态流转 + 项目回填 + 备注 + 删除
    tid = topics[0]["id"]
    upd = client.put(f"/api/hotspot/topics/{tid}", json={"status": "doing"}).json()
    assert upd["status"] == "doing"
    upd = client.put(f"/api/hotspot/topics/{tid}", json={"project_id": "abc123"}).json()
    assert upd["project_id"] == "abc123"
    upd = client.put(f"/api/hotspot/topics/{tid}", json={"note": "已联系出镜"}).json()
    assert upd["note"] == "已联系出镜"
    assert client.delete(f"/api/hotspot/topics/{tid}").status_code == 200
    assert client.put(f"/api/hotspot/topics/{tid}", json={"status": "todo"}).status_code == 404
    # 批量清理（再造一条 doing）
    client.post("/api/hotspot/ai-topics", json={"item_ids": ["a1"], "count": 1})
    tid2 = client.get("/api/hotspot/topics").json()[0]["id"]
    client.put(f"/api/hotspot/topics/{tid2}", json={"status": "doing"})
    c = client.post("/api/hotspot/topics/clear", json={"statuses": ["doing"]}).json()
    assert c["removed"] >= 1
    assert client.post("/api/hotspot/topics/clear", json={"statuses": ["bad"]}).status_code == 400
    # 空选择 → 400
    assert client.post("/api/hotspot/ai-topics", json={"item_ids": ["nope"]}).status_code == 400


def test_route_export_csv(client):
    r = client.get("/api/hotspot/export.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    text = r.content.decode("utf-8-sig")  # BOM 被剥掉
    lines = text.strip().splitlines()
    assert lines[0].startswith("平台,排名,标题")
    assert len(lines) >= 3  # 表头 + 2 条数据
    assert "AI热点" in text


def test_service_briefing(svc, monkeypatch):
    monkeypatch.setattr(sources, "fetch_all", lambda platforms=None: {
        "douyin": [_raw("共振大事件", hot=900000), _raw("普通热点", hot=100)],
    })
    svc.refresh()
    b = svc.briefing(3)
    assert b["items"], "早报非空"
    assert b["items"][0]["reason"]
    assert b["stats"]["total"] == 2
    assert b["stats"]["fresh_24h"] == 2  # 刚抓的都是 24h 内新见
    assert b["stats"]["sources_ok"] == 1


def test_route_ai_briefing_cache(client, monkeypatch):
    calls = {"n": 0}

    def fake_commentary(brief_items, model_id):
        calls["n"] += 1
        return [{"ref": brief_items[0]["title"], "form": "口播", "angle": "角度", "risk": "无"}]

    monkeypatch.setattr(llm, "generate_briefing_commentary", fake_commentary)
    r1 = client.post("/api/hotspot/ai-briefing")
    assert r1.status_code == 200
    assert r1.json()["comments"][0]["form"] == "口播"
    r2 = client.post("/api/hotspot/ai-briefing")  # 缓存命中
    assert calls["n"] == 1
    assert r2.json()["comments"][0]["form"] == "口播"


def test_briefing_overlap(svc, monkeypatch):
    # 第一轮：只有一份快照 → 无环比
    monkeypatch.setattr(sources, "fetch_all", lambda platforms=None: {
        "douyin": [_raw("热点A", hot=900000), _raw("热点B", hot=100)],
    })
    svc.refresh()
    b1 = svc.briefing(5)
    assert "overlap_pct" not in b1["stats"]
    # 第二轮：A 在榜、B 换成 C → 重合 50%
    monkeypatch.setattr(sources, "fetch_all", lambda platforms=None: {
        "douyin": [_raw("热点A", hot=800000), _raw("热点C", hot=200)],
    })
    svc.refresh()
    b2 = svc.briefing(5)
    assert b2["stats"]["overlap_pct"] == 50.0


def test_service_topics_dedup_counts(svc):
    svc.add_topics([{"title": "选题A", "ref": "热点X"}, {"title": "选题B", "ref": "热点x "}])
    counts = svc.ref_counts()
    assert counts[hs.normalize_title("热点X")] == 2  # 标题归一后计数
    assert svc.update_topic("nonexistent", status="doing") is None
