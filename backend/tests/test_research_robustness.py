# -*- coding: utf-8 -*-
"""六步流程第 1 步搜索的健壮性：备用检索词、薄资料预检、纠偏重试、诊断报错。"""
import pytest

from app.services import flow, llm, websearch


# ---------- _alt_query ----------

def test_alt_query_prefers_parenthetical_identifier():
    assert websearch._alt_query("解放双手，AI帮我投简历（ai-job-search）") == "ai-job-search"
    assert websearch._alt_query("AI 投简历工具(ai-job helper)") == "ai-job helper"


def test_alt_query_falls_back_to_simplified():
    out = websearch._alt_query("人工智能的发展，简史？")
    assert out == "人工智能的发展 简史"
    # 与原词等价 → 无备用词
    assert websearch._alt_query("人工智能") == ""


# ---------- gather_research_context 薄结果兜底 ----------

def _mk(url, title, snippet="摘要"):
    return {"title": title, "url": url, "snippet": snippet, "provider": "bing"}


def test_gather_merges_alt_query_and_ranks_relevant_first(monkeypatch):
    calls = []

    def fake_search(query, max_results=8):
        calls.append(query)
        if query == "ai-job-search":  # 精确标识命中 GitHub/知乎类可抓正文的结果
            return [
                _mk("https://example.com/b", "B"),
                _mk("https://github.com/x/ai-job-search", "ai-job-search: AI 投简历代理"),
            ]
        return [_mk("https://tv.example.com/jiefang", "电视剧《解放》"), _mk("https://e.com/z", "Z")]

    monkeypatch.setattr(websearch, "search_web", fake_search)
    monkeypatch.setattr(
        websearch, "fetch_page_text",
        lambda url, max_chars=6000: "正文" * 1000 if "github" in url else "",
    )
    ctx, sources = websearch.gather_research_context("解放双手，AI帮我投简历（ai-job-search）")
    assert len(calls) == 2 and calls[1] == "ai-job-search"  # 备用词始终并行搜索
    assert len(sources) == 4  # 合并去重后重建（top 6）
    assert sources[0]["url"].startswith("https://github.com")  # token 重合度排前
    assert len(ctx) >= 1200


def test_rank_by_overlap_puts_identifier_matches_first():
    items = [
        _mk("https://tv.example.com/jiefang", "电视剧《解放》"),
        _mk("https://github.com/x/ai-job-search", "ai-job-search: AI 投简历代理"),
        _mk("https://qcc.example.com/jn", "金乡县某彩钢房厂 工商信息"),
    ]
    ranked = websearch._rank_by_overlap(items, ["解放双手，AI帮我投简历（ai-job-search）", "ai-job-search"])
    assert ranked[0]["url"].startswith("https://github.com")
    assert ranked[1]["url"].startswith("https://tv.")  # 「解放」偶合仍高于零重合


def test_gather_no_fallback_when_first_pass_thick(monkeypatch):
    calls = []

    def fake_search(query, max_results=8):
        calls.append(query)
        return [_mk("https://e.com/a", "A"), _mk("https://e.com/b", "B")]

    monkeypatch.setattr(websearch, "search_web", fake_search)
    monkeypatch.setattr(
        websearch, "fetch_page_text", lambda url, max_chars=6000: "充实正文" * 500
    )
    ctx, sources = websearch.gather_research_context("人工智能简史")
    assert len(calls) == 1  # 首轮够厚，不再二次搜索
    assert len(sources) == 2 and len(ctx) > 1200


def test_gather_alt_not_found_keeps_first_pass(monkeypatch):
    calls = []

    def fake_search(query, max_results=8):
        calls.append(query)
        return [_mk("https://e.com/a", "A")]

    monkeypatch.setattr(websearch, "search_web", fake_search)
    monkeypatch.setattr(websearch, "fetch_page_text", lambda url, max_chars=6000: "")
    ctx, sources = websearch.gather_research_context("冷门话题（no-hit-alt）")
    assert len(calls) == 2  # 备用词照常搜索
    assert len(sources) == 1  # 备用词无新增结果 → 保留首轮


# ---------- generate_research ----------

def test_generate_research_rejects_thin_context():
    with pytest.raises(ValueError, match="网络检索资料太少"):
        llm.generate_research("t", "太短", None)


def test_generate_research_retries_on_missing_nodes(monkeypatch):
    calls = []

    def fake_chat(model_id, user, temperature, system_prompt, retries=1):
        calls.append(user)
        if len(calls) == 1:
            return {"topic": "t"}  # 缺 nodes
        return {"nodes": [{"title": "n"}]}

    monkeypatch.setattr(llm, "_chat_json", fake_chat)
    data = llm.generate_research("t", "资" * 900, None)
    assert data["nodes"] == [{"title": "n"}]
    assert len(calls) == 2 and "非空的 nodes 数组" in calls[1]  # 第二次带纠偏指令


def test_generate_research_error_includes_raw_head(monkeypatch):
    monkeypatch.setattr(llm, "_chat_json", lambda *a, **k: {"topic": "t", "foo": 1})
    with pytest.raises(ValueError, match="模型输出开头") as ei:
        llm.generate_research("t", "资" * 900, None)
    assert "foo" in str(ei.value)  # 带上原始输出便于诊断


# ---------- run_research 诊断报错 ----------

def test_run_research_wraps_error_with_diagnosis(monkeypatch, tmp_path):
    monkeypatch.setattr(flow, "PROJECTS_DIR", tmp_path)
    monkeypatch.setattr(
        flow.websearch, "gather_research_context",
        lambda q, page_count=4: ("短", [{"fetched": False}, {"fetched": False}]),
    )

    def boom(*a, **k):
        raise ValueError("模型未返回知识节点（资料可能不相关或过少）")

    monkeypatch.setattr(flow.llm, "generate_research", boom)
    msgs = []
    with pytest.raises(RuntimeError) as ei:
        flow.run_research("p1", "话题", None, lambda **kw: msgs.append(kw))
    assert "2 条来源、抓到正文 0 条" in str(ei.value)  # 诊断信息进报错


def test_run_research_success_persists(monkeypatch, tmp_path):
    monkeypatch.setattr(flow, "PROJECTS_DIR", tmp_path)
    monkeypatch.setattr(
        flow.websearch, "gather_research_context",
        lambda q, page_count=4: ("资" * 2000, [{"fetched": True}]),
    )
    monkeypatch.setattr(
        flow.llm, "generate_research",
        lambda *a, **k: {"nodes": [
            {"year": "2020", "title": f"节点{i}", "what": "w", "why": "y",
             "sources": [{"title": "s", "url": "https://e.com"}]}
            for i in range(4)
        ]},
    )
    msgs = []
    flow.run_research("p2", "话题", None, lambda **kw: msgs.append(kw))
    data = flow.load_research("p2")
    assert len(data["nodes"]) == 4
    assert (tmp_path / "p2" / "research.md").exists()
    assert any("完成" in m.get("message", "") for m in msgs)
