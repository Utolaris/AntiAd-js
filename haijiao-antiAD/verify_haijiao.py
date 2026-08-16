#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""海角网广告清理油猴脚本 — Playwright 有头模式验证"""
import json
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path("/Users/utolaris/Documents/Codex/2026-08-16/https-board-nlqpnuezk-cc-author-99/outputs")
SCRIPT = (OUT / "haijiao-adblock.user.js").read_text(encoding="utf-8")

BASE = "https://board.nlqpnuezk.cc"
PAGES = {
    "home": f"{BASE}/",
    "detail": f"{BASE}/archives/184180/",
    "author": f"{BASE}/author/99/",
}
UA_PC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
UA_ANDROID = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"

# DOM 中禁止出现的广告特征（选择器 → 说明）
AD_SELECTORS = [
    ("[data-ad_slot_key]", "广告槽位标记元素"),
    ('[data-event="ad_click"]', "广告点击元素"),
    (".ad-banners", "横幅广告容器"),
    (".fl-banner", "浮动横幅广告容器"),
    (".xqbj-component-advertises", "弹窗图片广告容器"),
    (".xqbj-component-adfloat, #adFloat", "右下角悬浮轮播广告"),
    (".ad-wrap", "底部横幅广告容器"),
    (".home-announce-bar", "顶部通栏广告条"),
    (".ai-link-ad", "AI 科技弹窗入口"),
    (".age-gate", "年龄门遮罩（自动移除）"),
    (".xqbj-list-rows-placard", "feed 伪装广告"),
    (".dplayer-pre-bg, .dplayer-pre-img, .dplayer-pre-countdown", "视频前贴片广告 DOM"),
]

DETAIL_REMOVED = [
    (".tags-group", "按钮广告组"),
    (".text-wrap", "推广/公告块"),
    (".article-btn-group", "上一篇/下一篇"),
    (".article-preview-container", "相关推荐"),
    (".link-wrapper", "分享/点赞区"),
    (".comment-wrap", "评论区"),
]

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    tag = "PASS" if cond else "FAIL"
    print(f"  [{tag}] {name}" + (f" — {detail}" if detail else ""))


def run_case(page, label, url, is_detail):
    print(f"\n===== {label}: {url} =====")
    t0 = time.time()
    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    # 等待注入完成（class 移除 = 已 reveal）
    page.wait_for_function(
        "() => !document.documentElement.classList.contains('hj-adblock-busy')",
        timeout=30000,
    )
    # 等站点脚本跑完一轮
    page.wait_for_timeout(4000)
    t_load = time.time() - t0

    # 1) 广告特征元素必须为 0
    for sel, desc in AD_SELECTORS:
        n = page.locator(sel).count()
        check(f"无{desc}", n == 0, f"count={n} sel={sel}")

    # 2) 详情页纯净模式
    if is_detail:
        for sel, desc in DETAIL_REMOVED:
            n = page.locator(sel).count()
            check(f"详情页无{desc}", n == 0, f"count={n}")
        main = page.locator(".xqbj-main-container.details .main-container")
        kids = main.locator(":scope > *")
        names = kids.evaluate_all("els => els.map(e => e.className || e.tagName)")
        check("详情页仅保留 标题/元信息/正文", len(names) <= 3, f"children={names}")

    # 3) 标题 + 正文完整
    h1 = page.locator("h1.novel-title").first
    if is_detail:
        check("标题存在", h1.count() == 1 and len(h1.inner_text().strip()) > 0, h1.inner_text().strip()[:40] if h1.count() else "")
        body = page.locator(".text.text-content").first
        check("正文存在", body.count() == 1 and len(body.inner_text().strip()) > 100)
        imgs = page.locator(".text-content img").count()
        check("正文图片保留", imgs > 0, f"img={imgs}")
        vids = page.locator(".dplayer[data-config]").count()
        check("播放器保留", vids >= 1, f"player={vids}")
        # 4) 视频 data-config 无前贴片广告
        if vids:
            cfgs = page.locator(".dplayer[data-config]").evaluate_all(
                "els => els.map(e => e.getAttribute('data-config'))"
            )
            ok = True
            for cfg in cfgs:
                try:
                    obj = json.loads(cfg)
                    if obj.get("video_player_ads"):
                        ok = False
                except Exception:
                    ok = False
            check("视频配置无 video_player_ads", ok)
    else:
        title_ok = page.evaluate("() => !!document.title && document.getElementById('xqbj-container')")
        check("页面结构正常", title_ok, page.title()[:50])

    # 5) 页面可见性已恢复
    vis = page.evaluate("getComputedStyle(document.documentElement).visibility")
    check("页面已恢复可见", vis != "hidden", f"visibility={vis}")

    # 6) window.open 守卫
    blocked = page.evaluate(
        "() => { const r = window.open('about:blank', 'ai_float_popup_9'); "
        "return r === null; }"
    )
    check("ai_float_popup_ 弹窗被拦截", blocked)

    # 7) 广告图片请求未加载（banner 图片域名不应有网络请求）
    ads_loaded = page.evaluate(
        "() => performance.getEntriesByType('resource')"
        ".filter(r => /(hc237|longzhouems|sfnzn|8120|2082|mibi63)/.test(r.name)).length"
    )
    check("广告资源未加载", ads_loaded == 0, f"ads_requests={ads_loaded}")

    # 8) 详情页：实测播放器无前贴片广告（点击播放，1.5s 后应已出画面且无广告 DOM）
    if is_detail and page.locator(".dplayer video").count() > 0:
        try:
            page.locator(".dplayer").first.scroll_into_view_if_needed(timeout=5000)
            box = page.locator(".dplayer").first.bounding_box()
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.wait_for_timeout(2500)
            t = page.evaluate(
                "() => { const v = document.querySelector('.dplayer video'); "
                "return v ? v.currentTime : -1; }"
            )
            pre = page.locator(".dplayer-pre-bg, .dplayer-pre-img, .dplayer-pre-countdown").count()
            check("播放后无前贴片广告DOM", pre == 0, f"pre_ad_dom={pre}")
            check("视频已开始播放(currentTime>0)", t > 0, f"currentTime={t}")
        except Exception as e:
            check("播放器可交互", False, str(e)[:80])

    # 截图（回到顶部，等图片加载，便于人工核验水印）
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(1500)
    shot = OUT / f"shot_{label}.png"
    page.screenshot(path=str(shot), full_page=False)
    print(f"  截图: {shot}  (加载耗时 {t_load:.2f}s)")
    return t_load


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled"])
        timings = {}
        for ua_name, ua in [("PC", UA_PC), ("Android", UA_ANDROID)]:
            ctx = browser.new_context(
                user_agent=ua,
                viewport={"width": 1280, "height": 900} if ua_name == "PC" else {"width": 412, "height": 915},
                device_scale_factor=1,
                locale="zh-CN",
            )
            ctx.add_init_script(SCRIPT)  # 等价于 Tampermonkey document-start 注入
            page = ctx.new_page()
            popups = []
            page.on("popup", lambda pp: popups.append(pp.url))
            for key, url in PAGES.items():
                t = run_case(page, f"{ua_name}_{key}", url, is_detail=(key == "detail"))
                timings[f"{ua_name}_{key}"] = t
            check(f"{ua_name} 无弹窗新窗口", len(popups) == 0, f"popups={popups}")
            ctx.close()
        browser.close()

    print("\n================= 汇总 =================")
    fails = [r for r in results if not r[1]]
    print(f"总检查项: {len(results)}  通过: {len(results) - len(fails)}  失败: {len(fails)}")
    for name, ok, detail in fails:
        print(f"  FAIL: {name} {detail}")
    for k, v in timings.items():
        print(f"  耗时 {k}: {v:.2f}s")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
