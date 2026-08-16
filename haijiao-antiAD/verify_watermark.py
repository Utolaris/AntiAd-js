#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""水印去除验证 (headless): 处理前后右下角白色像素占比对比 + 封面图处理 + 截图"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path("/Users/utolaris/Documents/Codex/2026-08-16/https-board-nlqpnuezk-cc-author-99/outputs")
SCRIPT = (OUT / "haijiao-adblock.user.js").read_text(encoding="utf-8")

ANALYZE_JS = """() => {
  const imgs = [...document.querySelectorAll('.text-content .defaultimg img')].filter(i => i.complete && i.naturalWidth > 0);
  return imgs.slice(0, 4).map(img => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const W = c.width, H = c.height, d = cx.getImageData(0, 0, W, H).data;
    const x0 = Math.round(W * 0.55), y0 = Math.round(H * 0.55);
    let w = 0, t = 0;
    for (let y = y0; y < H; y += 2) for (let x = x0; x < W; x += 2) { const i = (y * W + x) * 4; t++; if (d[i] > 210 && d[i+1] > 210 && d[i+2] > 210) w++; }
    let w2 = 0, t2 = 0;
    for (let y = 0; y < Math.round(H * 0.45); y += 2) for (let x = 0; x < Math.round(W * 0.45); x += 2) { const i = (y * W + x) * 4; t2++; if (d[i] > 210 && d[i+1] > 210 && d[i+2] > 210) w2++; }
    return { br: +(w / t * 100).toFixed(2), tl: +(w2 / t2 * 100).toFixed(2), w: W, h: H, done: !!img.__hj_wm_done__ };
  });
}"""


UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def goto_retry(page, url, tries=3):
    for i in range(tries):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=90000)
            return True
        except Exception as e:
            print(f"  导航失败({i+1}/{tries}): {str(e)[:80]}")
            if i < tries - 1:
                page.wait_for_timeout(30000)
    return False


def wait_loaded(page, timeout_s=90):
    for _ in range(timeout_s):
        n = page.evaluate(
            "() => [...document.querySelectorAll('.text-content .defaultimg img')].filter(i => i.complete && i.naturalWidth > 0).length")
        if n >= 3:
            return n
        page.wait_for_timeout(1000)
    return n


def wait_processed(page, timeout_s=60):
    for _ in range(timeout_s):
        st = page.evaluate(
            """() => { const imgs=[...document.querySelectorAll('.text-content .defaultimg img')].filter(i=>i.complete&&i.naturalWidth>0);
                      return {n: imgs.length, done: imgs.filter(i=>i.__hj_wm_done__).length}; }""")
        if st["n"] >= 3 and st["done"] >= st["n"]:
            return st
        page.wait_for_timeout(1000)
    return st


def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        # ===== 基线(无脚本) =====
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        ok = goto_retry(page, "https://board.nlqpnuezk.cc/archives/184180/")
        n = wait_loaded(page) if ok else 0
        print("基线: 加载完成图片数 =", n)
        page.wait_for_timeout(4000)
        baseline = page.evaluate(ANALYZE_JS)
        print("基线(无脚本) 正文图右下角白色占比:", baseline)
        for i, b in enumerate(baseline):
            results.append((f"基线图{i+1}右下角确有水印", b["br"] > 5, f"br={b['br']}%"))
        ctx.close()

        # ===== 带脚本 =====
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, user_agent=UA)
        ctx.add_init_script(SCRIPT)
        page = ctx.new_page()
        ok = goto_retry(page, "https://board.nlqpnuezk.cc/archives/184180/")
        n = wait_loaded(page) if ok else 0
        print("带脚本: 加载完成图片数 =", n)
        st = wait_processed(page)
        print("带脚本: 处理状态 =", st)
        page.wait_for_timeout(3000)
        after = page.evaluate(ANALYZE_JS)
        print("带脚本(处理后) 正文图白色占比:", after)
        for i, a in enumerate(after):
            b = baseline[i] if i < len(baseline) else None
            results.append((f"处理后图{i+1}右下角水印消除", a["br"] < 2, f"br={a['br']}% (基线 {b['br'] if b else '?'}%)"))
            results.append((f"处理后图{i+1}左上角未被误伤", a["tl"] < 30, f"tl={a['tl']}%"))
        page.evaluate("window.scrollTo(0,0)")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT / "shot_wm_removed.png"), full_page=False)
        print("截图:", OUT / "shot_wm_removed.png")
        ctx.close()

        # ===== 首页封面图 =====
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, user_agent=UA)
        ctx.add_init_script(SCRIPT)
        page = ctx.new_page()
        ok = goto_retry(page, "https://board.nlqpnuezk.cc/")
        page.wait_for_timeout(15000)
        cov = page.evaluate(
            """() => { const imgs=[...document.querySelectorAll('img[src^="blob:"]')].filter(i=>i.complete&&i.naturalWidth>0);
                      return {total: imgs.length, done: imgs.filter(i=>i.__hj_wm_done__).length,
                              sample: imgs.slice(0,3).map(i=>({w:i.naturalWidth,h:i.naturalHeight}))}; }""")
        print("首页封面图处理情况:", cov)
        results.append(("首页封面图完成去水印", cov["total"] > 0 and cov["done"] >= cov["total"] * 0.8,
                        f"done={cov['done']}/{cov['total']}"))
        page.screenshot(path=str(OUT / "shot_wm_home.png"), full_page=False)
        ctx.close()
        browser.close()

    print("\n===== 汇总 =====")
    fails = [r for r in results if not r[1]]
    print(f"总检查: {len(results)} 通过: {len(results)-len(fails)} 失败: {len(fails)}")
    for name, ok, detail in fails:
        print(f"  FAIL: {name} — {detail}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
