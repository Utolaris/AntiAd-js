// ==UserScript==
// @name         第一版主网（m.diyibanzhu.me）广告清理
// @namespace    local.diyibanzhu.adblock
// @version      1.1.0
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

	/* 0. 网络层拦截: 阻断广告服务器请求(XHR/fetch/script/iframe/window.open) */
	var AD_HOST_RE = /(^|\.)(s503nvw|kpqppok|gewt00g)\.com(:\d+)?$/i;
	var isAdUrl = function (u) {
		if (!u) return false;
		var s = String(u);
		// 去掉协议/路径取 host
		var m = s.match(/^[a-z]+:\/\/([^/?#]+)/i);
		var host = m ? m[1] : s.split(/[\/?#]/)[0];
		return AD_HOST_RE.test(host);
	};
	// XHR 拦截(广告配置通过 XHR 拉取)
	try {
		var _xhrOpen = XMLHttpRequest.prototype.open;
		var _xhrSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.open = function (method, url) {
			this.__dybzBlocked = isAdUrl(url);
			return _xhrOpen.apply(this, arguments);
		};
		XMLHttpRequest.prototype.send = function () {
			if (this.__dybzBlocked) {
				try { this.abort(); } catch (e) { /* ignore */ }
				return;
			}
			return _xhrSend.apply(this, arguments);
		};
	} catch (e) { /* ignore */ }
	// fetch 拦截
	try {
		var _fetch = window.fetch;
		window.fetch = function (input, init) {
			var u = typeof input === "string" ? input : (input && input.url) || "";
			if (isAdUrl(u)) return Promise.reject(new TypeError("blocked by dybz-adblock"));
			return _fetch.call(this, input, init);
		};
	} catch (e) { /* ignore */ }
	// window.open 拦截(防弹出式广告窗口)
	try {
		var _winOpen = window.open;
		window.open = function (url, name, features) {
			if (isAdUrl(url)) return null;
			return _winOpen.call(window, url, name, features);
		};
	} catch (e) { /* ignore */ }
	// 动态创建的 script/iframe: 在 src setter 处拦截广告域名, 使其无法加载
	try {
		var _createElement = document.createElement.bind(document);
		document.createElement = function (tag, options) {
			var el = _createElement(tag, options);
			var t = String(tag).toLowerCase();
			if (t === "script" || t === "iframe") {
				var desc = Object.getOwnPropertyDescriptor(
					t === "script" ? HTMLScriptElement.prototype : HTMLIFrameElement.prototype,
					"src"
				);
				if (desc && desc.set) {
					Object.defineProperty(el, "src", {
						get: function () { return desc.get.call(this); },
						set: function (v) {
							if (isAdUrl(v)) return; // 广告域名: 拒绝赋值, 不加载
							return desc.set.call(this, v);
						},
						configurable: true
					});
				}
			}
			return el;
		};
	} catch (e) { /* ignore */ }

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
		// 广告域名资源节点(脚本/iframe/图片/样式)
		list = document.querySelectorAll('script[src], iframe[src], img[src], link[href]');
		for (i = 0; i < list.length; i++) {
			var el = list[i];
			var u = el.src || el.href || "";
			if (isAdUrl(u)) removeNode(el);
		}
		// 已知广告容器
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
