// ==UserScript==
// @name         第一版主网（m.diyibanzhu.me）广告清理
// @namespace    local.diyibanzhu.adblock
// @version      1.0.0
// @description  清理第一版主网移动端底部广告：正文下方漫画推广广告条(#ad.slide) + 底部隐形点击劫持层(opacity:0.01 透明块)。document-start 注入，页面不先渲染后注入。
// @author       local
// @match        https://m.diyibanzhu.me/*
// @match        https://*.diyibanzhu.me/*
// @match        https://m.diyibanzhu.rest/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

function main() {
	if (window.top !== window.self) return; // 只处理顶层页面

	/* 1. 立即隐藏页面内容(纯色背景) + 广告 CSS 规则 */
	var css = [
		"html { background: #f5f5f5 !important; }",
		"html.dybz-busy, html.dybz-busy body { visibility: hidden !important; }",
		/* 正文下方/上方的广告位 */
		"#ad, .slide-ad { display: none !important; }",
		/* 底部隐形点击劫持层: fixed + 固定尺寸 + 近乎透明(任意 bottom 行) */
		'div[style*="position:fixed"][style*="width:9.6vw"][style*="opacity:0.01"] { display: none !important; }',
		/* 兜底: 任意 fixed 且近乎透明的底部块 */
		'div[style*="position:fixed"][style*="opacity:0.01"] { display: none !important; }'
	].join("\n");
	var style = document.createElement("style");
	style.id = "dybz-adblock-style";
	style.textContent = css;
	var host = document.head || document.documentElement;
	host.appendChild(style);
	document.documentElement.classList.add("dybz-busy");

	/* 2. 清理函数 */
	function removeNode(n) {
		if (n?.parentNode) n.parentNode.removeChild(n);
	}
	function isClickLayer(el) {
		if (el.tagName !== "DIV") return false;
		var cs;
		try { cs = window.getComputedStyle(el); } catch (e) { return false; }
		if (cs.position !== "fixed") return false;
		var op = parseFloat(cs.opacity);
		if (!(op >= 0 && op < 0.05)) return false;
		var s = el.getAttribute("style") || "";
		// 内联特征: 9.6vw 宽的小块 + 0.01 透明度(无论是否已被 CSS 隐藏)
		if (/width\s*:\s*9\.6vw/i.test(s) && /opacity\s*:\s*0\.01/i.test(s)) return true;
		// 兜底: 已隐藏(rect 全 0)的 fixed 透明块
		var r = el.getBoundingClientRect();
		if (r.width === 0 && r.height === 0) return /bottom\s*:\s*[\d.]+vw/i.test(s);
		// 可见态: 贴底部 120px 内的小块
		if (r.bottom < window.innerHeight - 120) return false;
		if (r.height > 80 || r.width > window.innerWidth * 0.8) return false;
		return true;
	}
	function sweep() {
		var i, list;
		list = document.querySelectorAll("#ad, .slide-ad");
		for (i = 0; i < list.length; i++) removeNode(list[i]);
		// 隐形点击层(内联样式特征 + 计算样式兜底)
		list = document.querySelectorAll("div[style*='position:fixed'], div[style*='position: fixed']");
		for (i = 0; i < list.length; i++) {
			var el = list[i];
			if (isClickLayer(el)) removeNode(el);
		}
	}

	/* 3. MutationObserver + 兜底轮询 */
	var mo = null;
	if (window.MutationObserver) {
		mo = new MutationObserver(function () { sweep(); });
		mo.observe(document.documentElement, { childList: true, subtree: true });
	}
	var timer = setInterval(sweep, 1200);
	setTimeout(function () { clearInterval(timer); }, 45000);

	/* 4. 清理完成恢复显示 */
	function reveal() {
		document.documentElement.classList.remove("dybz-busy");
	}
	function onReady() {
		sweep();
		requestAnimationFrame(function () {
			setTimeout(reveal, 0);
		});
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", onReady);
	} else {
		onReady();
	}
}

function boot() {
	if (!document.documentElement) {
		setTimeout(boot, 0);
		return;
	}
	main();
}
boot();
