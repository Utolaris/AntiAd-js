// ==UserScript==
// @name         海角网广告清理（弹出/嵌入式/伪装广告 + 视频前贴片）
// @namespace    local.haijiao.adblock
// @version      1.0.0
// @description  清理海角网（Typecho/haijiao3 主题）三类广告：弹窗广告、嵌入式横幅、伪装成内容的广告；去除 DPlayer 前贴片广告；详情页纯净模式（仅保留标题/正文/图片/视频）。PC 与安卓通用。注入期间页面保持纯色背景，不先渲染后注入。
// @author       local
// @match        https://board.nlqpnuezk.cc/*
// @match        https://*.nlqpnuezk.cc/*
// @match        https://hjw01.com/*
// @match        https://www.hjw01.com/*
// @match        https://*.hjw01.com/*
// @match        https://hjw2026.com/*
// @match        https://hjwang26.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

function main() {
	if (window.top !== window.self) return; // 只处理顶层页面

	/* ============ 配置 ============ */
	var IS_DETAIL = /\/archives\/\d+\/?/.test(location.pathname);
	// 详情页纯净模式：仅保留 标题 + 元信息 + 正文（含图片/视频），其余模块（广告/推荐/评论/点赞/公告）全部移除
	var DETAIL_PURE_MODE = true;

	/* ============ 1. 立即隐藏页面内容，只留纯色背景（防止先渲染后注入） ============ */
	var css = [
		"html { background: #f2f3f5 !important; }",
		"html.hj-adblock-busy, html.hj-adblock-busy body { visibility: hidden !important; }",
		/* 广告通用标记（服务端渲染与动态注入均带这些属性） */
		"[data-ad_slot_key] { display: none !important; }",
		'[data-event="ad_click"] { display: none !important; }',
		/* 已知广告容器 */
		".ad-banners, .fl-banner, .xqbj-component-advertises, .xqbj-component-adfloat, #adFloat,",
		".ad-wrap, .home-announce-bar, .ai-link-ad, .age-gate, .xqbj-list-rows-placard,",
		/* 视频前贴片广告 DOM（兜底，正常走 data-config 清洗） */
		".dplayer-pre-bg, .dplayer-pre-img, .dplayer-pre-countdown",
		"{ display: none !important; }",
	].join("\n");
	var style = document.createElement("style");
	style.id = "hj-adblock-style";
	style.textContent = css;
	var styleHost = document.head || document.documentElement;
	styleHost.appendChild(style);
	document.documentElement.classList.add("hj-adblock-busy");

	/* ============ 2. 拦截 AI 科技弹窗（window.open 守卫） ============ */
	var _open = window.open;
	try {
		window.open = (url, name, features) => {
			if (typeof name === "string" && /^ai_float_popup_/.test(name))
				return null;
			return _open.call(window, url, name, features);
		};
	} catch (_e) {
		/* ignore */
	}

	/* ============ 3. 清洗函数 ============ */
	function removeNode(n) {
		if (n?.parentNode) n.parentNode.removeChild(n);
	}

	// 视频播放器：删除 data-config 中的前贴片广告配置
	function cleanVideoConfig(el) {
		var raw = el.getAttribute("data-config");
		var cfg;
		if (!raw) return;
		try {
			cfg = JSON.parse(raw);
			if (cfg && typeof cfg === "object") {
				if (
					Array.isArray(cfg.video_player_ads) &&
					cfg.video_player_ads.length
				) {
					delete cfg.video_player_ads;
					cfg.ads_skip = 1; // 双保险
					cfg.ads_duration = 0;
					el.setAttribute("data-config", JSON.stringify(cfg));
				}
			}
		} catch (_e) {
			/* 解析失败不动，避免破坏播放器 */
		}
	}

	// 详情页纯净模式：main-container 白名单
	function purifyDetail() {
		if (!DETAIL_PURE_MODE || !IS_DETAIL) return;
		var main = document.querySelector(
			".xqbj-main-container.details .main-container",
		);
		if (!main) return;
		var kids = main.children;
		var i, c;
		for (i = kids.length - 1; i >= 0; i--) {
			c = kids[i];
			if (c.matches?.("h1.novel-title, .detail-info-desc, .text.text-content"))
				continue;
			removeNode(c);
		}
	}

	function sweep() {
		var i, list, row;

		// 4.1 属性标记广告：data-ad_slot_key / data-event="ad_click"
		list = document.querySelectorAll(
			'[data-ad_slot_key], [data-event="ad_click"]',
		);
		for (i = 0; i < list.length; i++) removeNode(list[i]);

		// 4.2 已知容器
		list = document.querySelectorAll(
			".xqbj-component-advertises, .xqbj-component-adfloat, #adFloat, .ad-wrap, " +
				".home-announce-bar, .ai-link-ad, .age-gate",
		);
		for (i = 0; i < list.length; i++) removeNode(list[i]);

		// 4.3 伪装成内容的 feed 广告：移除 placard 及其仅含广告的父行
		list = document.querySelectorAll(".xqbj-list-rows-placard");
		for (i = 0; i < list.length; i++) {
			row = list[i].closest ? list[i].closest(".xqbj-list-rows") : null;
			removeNode(list[i]);
			if (row && row.children.length === 0) removeNode(row);
		}

		// 4.4 视频前贴片广告：清洗 data-config（必须在播放器初始化前完成）
		list = document.querySelectorAll(".dplayer[data-config], [data-config]");
		for (i = 0; i < list.length; i++) cleanVideoConfig(list[i]);

		// 4.5 详情页纯净模式
		purifyDetail();
	}

	/* ============ 4. MutationObserver：解析期同步清理 ============ */
	var mo = null;
	if (window.MutationObserver) {
		mo = new MutationObserver(() => {
			sweep();
		});
		mo.observe(document.documentElement, { childList: true, subtree: true });
	}

	/* ============ 5. 兜底轮询（覆盖动态注入/异步加载） ============ */
	var fallbackTimer = setInterval(() => {
		sweep();
	}, 1500);
	setTimeout(() => {
		clearInterval(fallbackTimer);
	}, 60000);

	/* ============ 6. 清理完成，恢复显示 ============ */
	function reveal() {
		document.documentElement.classList.remove("hj-adblock-busy");
	}
	function onReady() {
		sweep();
		requestAnimationFrame(() => {
			setTimeout(reveal, 0);
		});
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", onReady);
	} else {
		onReady();
	}
}

/* Playwright addInitScript 等极端环境下 documentElement 可能尚未就绪 */
function boot() {
	if (!document.documentElement) {
		setTimeout(boot, 0);
		return;
	}
	main();
}

boot();
