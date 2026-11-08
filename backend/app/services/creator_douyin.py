# -*- coding: utf-8 -*-
"""抖音创作者中心（creator.douyin.com）浏览器自动化。

职责：
- 扫码登录：无头浏览器打开登录页 → 截取二维码给前端展示 → 用户用抖音 App 扫码 →
  登录成功后把会话（storage_state）存到本仓库 storage/tokens/（D 盘），之后复用。
- 预约发布：上传成片、填标题/简介/话题、上传横竖双封面、选合集、勾自主声明、点发布。

边界与防呆：
- 系统不接触账号密码；会话 cookie 只存本机（不进 git）。
- 抖音页面改版会导致选择器失效：候选选择器全部集中在下方常量，失败自动截图
  storage/publish/screenshots/<task_id>.png 便于定位修复。
- C 盘防护：浏览器二进制（PLAYWRIGHT_BROWSERS_PATH）与临时目录（TMP/TEMP）
  在 import 本模块时即重定向到仓库内（D 盘），必须在 import playwright 之前生效。
"""
import json
import os
import random
import re
import threading
import time
import traceback
from pathlib import Path
from typing import Callable

from ..config import (
    APP_TMP_DIR,
    BACKEND_DIR,
    CREATOR_STATE_FILE,
    PLAYWRIGHT_BROWSERS_PATH,
    PUBLISH_SCREENSHOTS_DIR,
)

# ---- C 盘防护：先设环境变量，再（首次使用时）import playwright ----
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(PLAYWRIGHT_BROWSERS_PATH)
os.environ["TMP"] = str(APP_TMP_DIR)
os.environ["TEMP"] = str(APP_TMP_DIR)
os.environ["TMPDIR"] = str(APP_TMP_DIR)

CREATOR_HOME = "https://creator.douyin.com"
UPLOAD_URL = f"{CREATOR_HOME}/creator-micro/content/upload"
MANAGE_URL = f"{CREATOR_HOME}/creator-micro/content/manage"
LOGIN_HINTS = ("/login", "sso.douyin.com", "account.douyin.com")

# 登录二维码 overall 等待（秒）
LOGIN_TIMEOUT_SECONDS = 180
# 上传+转码等待（秒；大文件慢网络场景）
UPLOAD_TIMEOUT_SECONDS = 1800
# 点发布后的成功确认等待（秒）
PUBLISH_CONFIRM_TIMEOUT_SECONDS = 90

# ---------- 选择器候选（抖音改版时优先改这里）----------
SEL_LOGIN_URL_HINTS = LOGIN_HINTS
SEL_QR_IMG = [
    ".web-login-sc-code img",
    "[class*='qrcode'] img",
    "[class*='qrcode'] [style*='background-image']",
    "img[src^='data:image']",
    "[class*='login'] img[src^='data:image']",
]
SEL_QR_REFRESH = ["text=点击刷新", "text=刷新", "text=二维码已过期"]
SEL_FILE_INPUT = ["input[type='file']"]
SEL_TITLE_INPUT = [
    "input[placeholder*='标题']",
    ".title-input input",
    "[class*='title'] input[type='text']",
]
SEL_DESC_EDITOR = [
    "[contenteditable='true']",
]
SEL_COVER_ENTRY = [
    "text=编辑封面",
    "[class*='cover']:has-text('编辑')",
    "div:has-text('设置封面')",
]
SEL_COVER_TAB_V = ["text=竖版封面", "text=竖版", "[class*='vertical']"]
SEL_COVER_TAB_H = ["text=横版封面", "text=横版", "[class*='horizontal']"]
SEL_COVER_DIALOG_INPUT = [
    "[class*='modal'] input[type='file']",
    "[class*='dialog'] input[type='file']",
    "[role='dialog'] input[type='file']",
    "input[type='file'][accept*='image']",
    "input[type='file']",
]
SEL_COVER_CONFIRM = ["button:has-text('完成')", "button:has-text('确定')", "button:has-text('确认')"]
SEL_COLLECTION_ENTRY = [
    "text=添加到合集",
    "[class*='collection']",
    "text=合集",
]
SEL_COLLECTION_INPUT = [
    "input[placeholder*='搜索']",
    "[class*='collection'] input",
]
SEL_DECLARE_SECTION = ["text=自主声明", "[class*='declare']", "[class*='statement']"]
SEL_PUBLISH_BTN = ["button"]
SEL_UPLOAD_FAIL_TEXT = ["上传失败", "格式不正确", "审核不通过"]

WarningsCB = Callable[[str], None]


# ---------- 基础设施 ----------

def _require_playwright():
    """启动并返回 Playwright 实例（sync_playwright() 是上下文管理器，需先调用再 start）。"""
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
    except ImportError as e:  # pragma: no cover - 环境未装
        raise RuntimeError(
            "未安装 playwright。请先执行（浏览器装在仓库内，不占 C 盘）：\n"
            f"  $env:PLAYWRIGHT_BROWSERS_PATH=\"{PLAYWRIGHT_BROWSERS_PATH}\"\n"
            "  pip install --no-cache-dir playwright\n"
            "  python -m playwright install chromium"
        ) from e
    from playwright.sync_api import sync_playwright
    return sync_playwright().start()


def _pause(page, lo: float = 0.4, hi: float = 1.1) -> None:
    time.sleep(random.uniform(lo, hi))


def _shot(page, task_id: str, tag: str = "fail") -> Path | None:
    """失败截图（发布自动化排障的关键证据）。"""
    try:
        PUBLISH_SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        out = PUBLISH_SCREENSHOTS_DIR / f"{task_id}-{tag}.png"
        page.screenshot(path=str(out), full_page=True)
        return out
    except Exception:  # noqa: BLE001 — 截图失败不掩盖原异常
        return None


def _first(page, candidates: list[str]):
    """返回第一个可见的 locator（找不到返回 None）。"""
    for sel in candidates:
        try:
            loc = page.locator(sel).first
            if loc.count() and loc.is_visible():
                return loc
        except Exception:  # noqa: BLE001 — 选择器不存在/页面未就绪
            continue
    return None


def _state_file_fresh(max_age_days: int = 30) -> bool:
    p = CREATOR_STATE_FILE
    if not p.exists():
        return False
    return (time.time() - p.stat().st_mtime) < max_age_days * 86400


def _new_page(pw, use_state: bool):
    """起浏览器 + 页面；use_state=True 时载入已存会话。"""
    kwargs = {"storage_state": str(CREATOR_STATE_FILE)} if use_state else {}
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1380, "height": 900},
        locale="zh-CN",
        timezone_id="Asia/Shanghai",
        **kwargs,
    )
    page = context.new_page()
    page.set_default_timeout(15000)
    return browser, context, page


def _is_login_page(url: str) -> bool:
    return any(h in url for h in SEL_LOGIN_URL_HINTS)


# ---------- 登录：扫码会话（模块级单例，串行） ----------

_login_lock = threading.Lock()
_login = {"pw": None, "browser": None, "context": None, "page": None, "deadline": 0.0}


def _login_cleanup() -> None:
    for key in ("page", "context", "browser"):
        obj = _login.get(key)
        if obj is not None:
            try:
                obj.close()
            except Exception:  # noqa: BLE001
                pass
        _login[key] = None
    pw = _login.get("pw")
    if pw is not None:
        try:
            pw.stop()
        except Exception:  # noqa: BLE001
            pass
        _login["pw"] = None


def login_start() -> dict:
    """发起扫码登录：打开登录页并截取二维码。返回 state: ok | already_logged_in。"""
    with _login_lock:
        _login_cleanup()
        _login["pw"] = _require_playwright()
        try:
            browser, context, page = _new_page(_login["pw"], use_state=_state_file_fresh())
        except Exception:
            _login_cleanup()
            raise
        _login.update(browser=browser, context=context, page=page, deadline=time.time() + LOGIN_TIMEOUT_SECONDS)
        try:
            page.goto(UPLOAD_URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2500)
            if not _is_login_page(page.url):
                _save_state(context)
                _login_cleanup()
                return {"state": "already_logged_in", "message": "已有有效登录会话"}
        except Exception:
            _login_cleanup()
            raise
        return {"state": "ok", "message": "二维码已生成，请用抖音 App 扫码"}


def login_qr() -> bytes | None:
    """当前二维码 PNG（每次调用重新截取，前端轮询即可拿到刷新后的码）。"""
    with _login_lock:
        page = _login.get("page")
        if page is None:
            return None
        qr = _first(page, SEL_QR_IMG)
        if qr is None:
            return None
        try:
            return qr.screenshot()
        except Exception:  # noqa: BLE001 — 元素截图失败退回整页
            try:
                return page.screenshot()
            except Exception:  # noqa: BLE001
                return None


def login_poll() -> dict:
    """轮询扫码登录状态：waiting | success | expired | idle。"""
    with _login_lock:
        page = _login.get("page")
        if page is None:
            return {"state": "idle", "message": "没有进行中的登录"}
        if not _is_login_page(page.url):
            try:
                _save_state(_login["context"])
                return {"state": "success", "message": "登录成功，会话已保存"}
            finally:
                _login_cleanup()
        if time.time() > _login.get("deadline", 0):
            _login_cleanup()
            return {"state": "expired", "message": "二维码已过期，请重新发起扫码"}
        # 二维码过期自动点刷新
        refresh = _first(page, SEL_QR_REFRESH)
        if refresh is not None:
            try:
                refresh.click()
            except Exception:  # noqa: BLE001
                pass
        return {"state": "waiting", "message": "等待扫码确认…"}


def login_cancel() -> None:
    with _login_lock:
        _login_cleanup()


def _save_state(context) -> None:
    CREATOR_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    context.storage_state(path=str(CREATOR_STATE_FILE))


def check_status() -> dict:
    """用已存会话访问创作者中心，验证登录态。"""
    if not CREATOR_STATE_FILE.exists():
        return {"logged_in": False, "message": "尚未扫码登录"}
    pw = _require_playwright()
    try:
        browser, context, page = _new_page(pw, use_state=True)
        try:
            page.goto(UPLOAD_URL, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2500)
            ok = not _is_login_page(page.url)
            age_days = round((time.time() - CREATOR_STATE_FILE.stat().st_mtime) / 86400, 1)
            msg = "登录态有效" if ok else "登录态已失效，请重新扫码"
            return {"logged_in": ok, "saved_at": CREATOR_STATE_FILE.stat().st_mtime,
                    "age_days": age_days, "message": msg}
        finally:
            context.close()
            browser.close()
    except Exception as e:  # noqa: BLE001 — 网络/环境问题不假装已登录
        print(f"[creator] check_status 异常: {e}\n{traceback.format_exc()[-400:]}", flush=True)
        return {"logged_in": False, "message": f"登录态检查失败：{e}"}
    finally:
        try:
            pw.stop()
        except Exception:  # noqa: BLE001
            pass


def logout() -> None:
    if CREATOR_STATE_FILE.exists():
        CREATOR_STATE_FILE.unlink()


# ---------- 发布 ----------

def _wait_upload_done(page, progress: WarningsCB | None, deadline: float) -> None:
    """等待视频上传+转码完成（发布按钮变为可用）。"""
    while time.time() < deadline:
        fail_text = _first(page, SEL_UPLOAD_FAIL_TEXT)
        if fail_text is not None:
            raise RuntimeError("抖音上传页提示失败（详见截图）")
        btn = _publish_button(page)
        if btn is not None:
            try:
                if btn.is_enabled():
                    return
            except Exception:  # noqa: BLE001 — 元素尚未稳定
                pass
        if progress:
            progress("视频上传/转码中…")
        page.wait_for_timeout(3000)
    raise RuntimeError("等待上传/转码超时")


def _publish_button(page):
    """发布按钮（排除 存草稿/定时发布）。"""
    try:
        buttons = page.locator("button")
        for i in range(buttons.count()):
            b = buttons.nth(i)
            try:
                if not b.is_visible():
                    continue
                text = (b.inner_text() or "").strip()
            except Exception:  # noqa: BLE001
                continue
            if text == "发布" and b.is_enabled():
                return b
            if text.startswith("发布") and "草稿" not in text and "定时" not in text:
                return b
    except Exception:  # noqa: BLE001
        return None
    return None


def _type_tag(page, tag: str, editor) -> None:
    """在简介编辑器里输入 #话题 并优先选中联想词（失败则保留纯文本）。"""
    page.keyboard.type(f"#{tag}")
    page.wait_for_timeout(900)
    picked = False
    for sel in (".mention-item", "[class*='mention'] [class*='item']", "[class*='suggest'] [class*='item']"):
        try:
            item = page.locator(sel).first
            if item.count() and item.is_visible():
                item.click()
                picked = True
                break
        except Exception:  # noqa: BLE001
            continue
    if not picked:
        try:
            page.keyboard.press("Escape")
        except Exception:  # noqa: BLE001
            pass
        page.keyboard.type(" ")
    page.wait_for_timeout(300)


def _upload_cover(page, cover: Path, tab_candidates: list[str], which: str) -> None:
    """在封面弹窗里切到指定版式 tab 并上传图片、确认。"""
    tab = _first(page, tab_candidates)
    if tab is not None:
        tab.click()
        _pause(page)
    dlg_input = _first(page, SEL_COVER_DIALOG_INPUT)
    if dlg_input is None:
        raise RuntimeError(f"找不到{which}封面的上传入口（页面可能改版，见截图）")
    dlg_input.set_input_files(str(cover))
    _pause(page, 1.0, 2.0)
    confirm = _first(page, SEL_COVER_CONFIRM)
    if confirm is None:
        raise RuntimeError(f"找不到{which}封面的确认按钮（页面可能改版，见截图）")
    confirm.click()
    _pause(page, 0.8, 1.6)


def publish(
    task_id: str,
    video: Path,
    title: str,
    desc: str,
    tags: list[str],
    collection: str,
    declarations: list[str],
    cover_v: Path | None,
    cover_h: Path | None,
    progress: WarningsCB | None = None,
) -> dict:
    """全自动发布一条视频到抖音创作者中心。任何一步失败抛异常（并留截图）。

    返回 {"item_id": str}（创作者中心拿不到 item_id，恒为空串，仅作占位）。"""
    warnings: list[str] = []
    if not CREATOR_STATE_FILE.exists():
        raise RuntimeError("尚未扫码登录抖音创作者中心")
    if not video.exists():
        raise RuntimeError(f"成片不存在：{video}")
    pw = _require_playwright()
    page = None
    try:
        browser, context, page = _new_page(pw, use_state=True)
        page.goto(UPLOAD_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(3000)
        if _is_login_page(page.url):
            raise RuntimeError("登录态已失效，请先在发布中心重新扫码登录")

        # 1) 上传成片
        if progress:
            progress("正在上传成片…")
        finput = _first(page, SEL_FILE_INPUT)
        if finput is None:
            raise RuntimeError("找不到上传文件入口（页面可能改版，见截图）")
        finput.set_input_files(str(video))
        _wait_upload_done(page, progress, time.time() + UPLOAD_TIMEOUT_SECONDS)
        if progress:
            progress("上传完成，开始填写发布信息…")

        # 2) 标题 + 简介 + 话题
        title_input = _first(page, SEL_TITLE_INPUT)
        desc_editor = None
        for sel in SEL_DESC_EDITOR:
            try:
                cand = page.locator(sel)
                for i in range(cand.count()):
                    el = cand.nth(i)
                    try:
                        if el.is_visible() and (el.get_attribute("aria-label") or "") != "":
                            desc_editor = el
                            break
                    except Exception:  # noqa: BLE001
                        continue
                if desc_editor is not None:
                    break
                if cand.count():
                    desc_editor = cand.first
                    break
            except Exception:  # noqa: BLE001
                continue
        if title_input is not None:
            title_input.click()
            page.keyboard.type(title)
            _pause(page)
            if desc_editor is not None and desc.strip():
                desc_editor.click()
                page.keyboard.type(desc)
                page.wait_for_timeout(300)
                for tag in tags:
                    _type_tag(page, tag, desc_editor)
        else:
            # 页面没有独立标题输入框：标题+简介+话题合并进简介编辑器
            if desc_editor is None:
                raise RuntimeError("找不到标题/简介输入区（页面可能改版，见截图）")
            desc_editor.click()
            page.keyboard.type(title)
            if desc.strip():
                page.keyboard.type("\n" + desc)
            for tag in tags:
                _type_tag(page, tag, desc_editor)
        _pause(page)

        # 3) 双封面（竖版 + 横版；用户硬性要求，失败即失败）
        if cover_v is not None or cover_h is not None:
            entry = _first(page, SEL_COVER_ENTRY)
            if entry is None:
                raise RuntimeError("找不到「编辑封面」入口（页面可能改版，见截图）")
            entry.click()
            page.wait_for_timeout(1200)
            try:
                if cover_v is not None and cover_v.exists():
                    _upload_cover(page, cover_v, SEL_COVER_TAB_V, "竖版")
                if cover_h is not None and cover_h.exists():
                    _upload_cover(page, cover_h, SEL_COVER_TAB_H, "横版")
            except Exception:
                _shot(page, task_id, tag="cover")
                raise
            _pause(page)

        # 4) 合集（配置了名称才算硬性要求）
        if collection:
            coll_entry = _first(page, SEL_COLLECTION_ENTRY)
            if coll_entry is None:
                _shot(page, task_id, tag="collection")
                raise RuntimeError("未找到合集入口：账号可能未开通合集功能，或页面已改版")
            coll_entry.click()
            page.wait_for_timeout(1000)
            search = _first(page, SEL_COLLECTION_INPUT)
            if search is not None:
                search.fill(collection)
                page.wait_for_timeout(1200)
            item = page.locator(f"text={collection}").first
            try:
                if item.count() and item.is_visible():
                    item.click()
                    _pause(page)
                else:
                    _shot(page, task_id, tag="collection")
                    raise RuntimeError(f"合集「{collection}」不存在，请先在创作者中心创建")
            except RuntimeError:
                raise
            except Exception as e:  # noqa: BLE001
                _shot(page, task_id, tag="collection")
                raise RuntimeError(f"选择合集失败：{e}") from e

        # 5) 自主声明（找不到的项记警告继续）
        for decl in declarations:
            try:
                section = _first(page, SEL_DECLARE_SECTION)
                if section is not None:
                    section.click()
                    page.wait_for_timeout(600)
                opt = page.locator(f"text={decl}").first
                if opt.count() and opt.is_visible():
                    opt.click()
                    _pause(page, 0.3, 0.8)
                else:
                    warnings.append(f"自主声明「{decl}」未在页面找到，已跳过")
            except Exception:  # noqa: BLE001
                warnings.append(f"自主声明「{decl}」设置失败，已跳过")

        # 6) 发布
        btn = _publish_button(page)
        if btn is None:
            _shot(page, task_id)
            raise RuntimeError("找不到发布按钮（页面可能改版，见截图）")
        if progress:
            progress("点击发布…")
        btn.click()
        ok = False
        deadline = time.time() + PUBLISH_CONFIRM_TIMEOUT_SECONDS
        while time.time() < deadline:
            try:
                url = page.url
                if "content/manage" in url or "content/publish" in url and "upload" not in url:
                    ok = True
                    break
            except Exception:  # noqa: BLE001
                pass
            for sel in ("text=发布成功", "[class*='toast']"):
                try:
                    t = page.locator(sel).first
                    if t.count() and t.is_visible():
                        ok = True
                        break
                except Exception:  # noqa: BLE001
                    continue
            if ok:
                break
            page.wait_for_timeout(1500)
        if not ok:
            _shot(page, task_id)
            raise RuntimeError("点击发布后未确认到成功提示（详见截图）")
        return {"item_id": "", "warnings": warnings}
    except Exception:
        if page is not None:
            _shot(page, task_id)
        raise
    finally:
        try:
            pw.stop()
        except Exception:  # noqa: BLE001
            pass


# ---------- 数据回流：作品表现数据抓取（创作者中心「内容管理」页） ----------

SEL_MANAGE_ROW = [
    "[class*='videoList'] [class*='item']",
    "[class*='video-list'] [class*='item']",
    "[class*='content-manage'] [class*='item']",
    "[class*='manage'] [class*='card']",
    "[class*='table'] tbody tr",
]
_STAT_LABELS = (("plays", "播放"), ("likes", "点赞"), ("collects", "收藏"),
                ("comments", "评论"), ("shares", "分享"))


def _parse_count(s: str) -> int:
    """"1.2万"/"856"/"3.5w" → 整数；解析不了返回 0。"""
    m = re.match(r"^([\d.]+)\s*(万|w|亿)?$", (s or "").strip().lower())
    if not m:
        return 0
    v = float(m.group(1))
    u = m.group(2)
    if u in ("万", "w"):
        v *= 10_000
    elif u == "亿":
        v *= 100_000_000
    return int(round(v))


def collect_stats(progress: WarningsCB | None = None) -> list[dict]:
    """抓「内容管理」页已发布作品的表层表现数据（best-effort，页面改版返回 []）。

    返回 [{"title","published_at","plays","likes","collects","comments","shares"}]。
    抓不到任何行时截图 storage/publish/screenshots/stats-no-rows.png 留证。
    """
    if not CREATOR_STATE_FILE.exists():
        raise RuntimeError("尚未扫码登录抖音创作者中心")
    pw = _require_playwright()
    page = None
    try:
        browser, context, page = _new_page(pw, use_state=True)
        page.goto(MANAGE_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)
        if _is_login_page(page.url):
            raise RuntimeError("登录态已失效，请先在发布中心重新扫码登录")
        rows = None
        for sel in SEL_MANAGE_ROW:
            try:
                loc = page.locator(sel)
                if loc.count():
                    rows = loc
                    break
            except Exception:  # noqa: BLE001 — 选择器不存在换下一个
                continue
        if rows is None or not rows.count():
            _shot(page, "stats", tag="no-rows")
            return []
        out: list[dict] = []
        for i in range(min(rows.count(), 50)):
            try:
                text = rows.nth(i).inner_text()
            except Exception:  # noqa: BLE001 — 单行失败跳过
                continue
            if not text.strip():
                continue
            flat = re.sub(r"\s+", " ", text)
            lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
            item: dict = {"title": max(lines, key=len)[:120] if lines else "",
                          "published_at": "", "plays": 0, "likes": 0,
                          "collects": 0, "comments": 0, "shares": 0}
            dt = re.search(r"(\d{4}-\d{2}-\d{2})", flat)
            if dt:
                item["published_at"] = dt.group(1)
            for key, label in _STAT_LABELS:
                m = re.search(label + r"[^\d]{0,6}([\d.]+\s*[万亿wW]?)", flat)
                if m:
                    item[key] = _parse_count(m.group(1))
            if item["title"]:
                out.append(item)
        if progress:
            progress(f"已读取 {len(out)} 条作品数据")
        return out
    except Exception:
        if page is not None:
            _shot(page, "stats")
        raise
    finally:
        try:
            pw.stop()
        except Exception:  # noqa: BLE001
            pass


def dump_state_summary() -> dict:
    """调试用：会话文件摘要（不含 cookie 内容）。"""
    p = CREATOR_STATE_FILE
    if not p.exists():
        return {"exists": False}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        return {"exists": True, "cookies": len(data.get("cookies", [])),
                "origins": len(data.get("origins", [])),
                "saved_at": p.stat().st_mtime}
    except Exception:  # noqa: BLE001
        return {"exists": True, "broken": True}
