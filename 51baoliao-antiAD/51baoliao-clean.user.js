// ==UserScript==
// @name         51爆料网纯净模式（文章页去广告 + 首页去广告）
// @namespace    local.fixtures.51baoliao-clean
// @version      1.6.4
// @description  51爆料网全站去广告：视频页纯背景过渡、仅保留标题+视频（标题字体与导航页一致）；DPlayer 控制条新增下载按钮（AES-128 解密合并，支持取消与实时进度，优先另存为流式写盘、降级浏览器下载）；首页/列表页移除浮点广告(#adFloat)、列表广告卡片(article.ad-item)等，点击视频链接纯色遮罩过渡。兼容桌面与安卓移动端。
// @author       local
// @match        *://*/*
// @run-at       document-start
// @grant        GM_download
// @noframes
// ==/UserScript==

(() => {
	let SHELL_ID = "clean-shell-v1";
	let HOOK_ID = "__51bl_clean_hook__";
	let HIDE_CSS_ID = "__51bl_hide_css__";
	let TRANSITION_CSS_ID = "__51bl_transition_css__";
	let MASK_ID = "__51bl_transition__";
	let built = false;

	// ============================================================
	// 站点风格常量（采样自导航页 alcohol.qprvlexj.com）
	// ============================================================
	let PAGE_BG = "#2C2A2A";
	let PAGE_FG = "#F0F0F0";
	let TITLE_FONT =
		'"Mirages Custom", Merriweather, "Open Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft Yahei", "WenQuanYi Micro Hei", "Segoe UI Emoji", "Segoe UI Symbol", Helvetica, Arial, sans-serif';
	let TITLE_COLOR = "#FFFFFF";
	let TITLE_SIZE_DESKTOP = "25px";
	let TITLE_LH_DESKTOP = "28.75px";
	let TITLE_SIZE_MOBILE = "18.6px";
	let TITLE_LH_MOBILE = "21.39px";
	let IS_ARTICLE = /\/archives\//.test(location.pathname);

	// ============================================================
	// 0. 根注入辅助：document-start 极早注入时 documentElement 可能
	//    尚未创建，等待其就绪再挂载，避免 appendChild 抛错导致
	//    整个脚本崩溃（某些浏览器/扩展注入时机早于 html 解析）
	// ============================================================
	function appendRoot(el) {
		let root = document.head || document.documentElement;
		if (root) {
			root.appendChild(el);
			return;
		}
		let wait = setInterval(() => {
			let r2 = document.head || document.documentElement;
			if (r2) {
				clearInterval(wait);
				r2.appendChild(el);
			}
		}, 5);
	}

	// ============================================================
	// 0a. 视频页过渡 CSS
	// ============================================================
	function injectTransitionCSS() {
		if (document.getElementById(TRANSITION_CSS_ID)) return;
		let style = document.createElement("style");
		style.id = TRANSITION_CSS_ID;
		style.textContent = [
			`html, body { background: ${PAGE_BG} !important; }`,
			"body > * { visibility: hidden !important; }",
		].join("\n");
		appendRoot(style);
	}

	function removeTransitionCSS() {
		let el = document.getElementById(TRANSITION_CSS_ID);
		if (el) el.remove();
	}

	// ============================================================
	// 0b. 广告隐藏 CSS
	// ============================================================
	function injectHideCSS() {
		if (document.getElementById(HIDE_CSS_ID)) return;
		let style = document.createElement("style");
		style.id = HIDE_CSS_ID;
		style.textContent = [
			"#adFloat, .xqbj-component-adfloat, article.ad-item",
			".adspop, .popup-container, .modal-overlay, .float_buttom",
			".horizontal-banner, #carouselContainerTop, .txt-apps",
			".article-bottom-apps, .a2a_kit, .post-near, .btn-download",
			".flash, .bling { display: none !important; }",
		].join(",\n");
		appendRoot(style);
	}

	// ============================================================
	// 1. 主世界钩子：禁用 DPlayer 片头/暂停广告
	// ============================================================
	function injectPreHook() {
		if (document.getElementById(HOOK_ID)) return;
		let s = document.createElement("script");
		s.id = HOOK_ID;
		s.textContent = `(${(
			() => {
				try {
					Object.defineProperty(window, "DPLAYER_PREROLL_AD", {
						configurable: true,
						get: () => window.__51bl_preroll_stub,
						set: () => {
							window.__51bl_preroll_stub = {
								pickAdConfig: () => null,
								attachPreRollAd: () => {},
								patchVideoInline: () => {},
								attachPauseAudioCleanup: () => {},
							};
						},
					});
				} catch (_e) {}
				// 屏蔽导航页的原生询问弹窗（广告 confirm/alert 等）
				try {
					window.alert = () => {};
				} catch (_e) {}
				try {
					window.confirm = () => false;
				} catch (_e) {}
				try {
					window.prompt = () => null;
				} catch (_e) {}
				// 从源头拦截 "AI科技" 广告体系脚本（浮点广告/中转弹窗），
				// 这些脚本会动态创建浮标与弹窗并引导到登录/中转页
				try {
					let obsAd = new MutationObserver((muts) => {
						muts.forEach((m) => {
							m.addedNodes.forEach((n) => {
								if (
									n &&
									n.tagName === "SCRIPT" &&
									n.src &&
									/adfloat-entry|index-ai/.test(n.src)
								) {
									n.remove();
								}
							});
						});
					});
					if (document.documentElement)
						obsAd.observe(document.documentElement, {
							childList: true,
							subtree: true,
						});
				} catch (_e) {}
			}
		).toString()})();`;
		appendRoot(s);
	}

	// ============================================================
	// 2. 清洗 .dplayer 的 data-config
	// ============================================================
	function sanitizePlayerConfig() {
		let list = document.querySelectorAll(".dplayer");
		for (let i = 0; i < list.length; i++) {
			let el = list[i];
			if (el.__51bl_clean) continue;
			let raw = el.getAttribute("data-config");
			if (!raw) continue;
			try {
				let cfg = JSON.parse(raw);
				let changed = false;
				// 只删除明确的播放器广告字段，避免误删 download/preload 等含 "ad" 子串的普通配置
				Object.keys(cfg).forEach((k) => {
					let adField =
						/^(ad|ads|advert|preroll)/i.test(k) ||
						/video_player_ads/i.test(k) ||
						/_ads?$/i.test(k);
					if (adField && k !== "ads_skip") {
						delete cfg[k];
						changed = true;
					}
				});
				if (cfg.ads_skip !== "1" && cfg.ads_skip !== 1) {
					cfg.ads_skip = "1";
					changed = true;
				}
				if (changed) el.setAttribute("data-config", JSON.stringify(cfg));
				el.__51bl_clean = true;
			} catch (_e) {}
		}
	}

	// ============================================================
	// 3. 通用广告判定与清理
	// ============================================================
	let AD_SELECTORS = [
		"#adFloat",
		".xqbj-component-adfloat",
		"article.ad-item",
		".adspop",
		".popup-container",
		".modal-overlay",
		".float_buttom",
		".horizontal-banner",
		"#carouselContainerTop",
		".txt-apps",
		".article-bottom-apps",
		".a2a_kit",
		".post-near",
		".btn-download",
		".flash",
		".bling",
	];

	function isAdNode(n) {
		if (n?.nodeType !== 1) return false;
		if (n.id === SHELL_ID) return false;
		// DPlayer 播放器内部（含我们注入的下载按钮）永远不参与广告判定
		let inPlayer = n.classList?.contains("dplayer") || n.closest?.(".dplayer");
		if (inPlayer) return false;
		if (
			n.id === "adFloat" ||
			/xqbj-component-adfloat/.test(String(n.className || ""))
		)
			return true;
		if (/ad-item/.test(String(n.className || ""))) return true;
		let c = String(n.className || "");
		if (
			/adspop|popup-container|modal-overlay|float_buttom|horizontal-banner|txt-apps|article-bottom-apps|a2a_kit|post-near|btn-download|carousel|flash|bling/i.test(
				c,
			)
		)
			return true;
		return false;
	}

	function removeAds() {
		for (let i = 0; i < AD_SELECTORS.length; i++) {
			let els = document.querySelectorAll(AD_SELECTORS[i]);
			for (let j = 0; j < els.length; j++) {
				let el = els[j];
				if (!el || el.id === SHELL_ID) continue;
				if (el.closest?.(".dplayer")) continue; // 不碰播放器内部
				el.remove();
			}
		}
	}

	function cleanListPage() {
		removeAds();
		let ads = document.querySelectorAll("article.ad-item");
		for (let i = 0; i < ads.length; i++) ads[i].remove();
	}

	// DPlayer 片头广告专项清除：dplayer-pre-img 是播放前广告图。
	// 即使 data-config 清洗未赶上初始化（广告已创建），也强制移除并恢复播放器状态。
	function removePreRollAds() {
		let list = document.querySelectorAll(".dplayer");
		for (let i = 0; i < list.length; i++) {
			let dp = list[i];
			let pre = dp.querySelector(".dplayer-pre-img");
			if (pre) pre.remove();
			if (dp.classList) {
				dp.classList.remove("dplayer-pre-playing", "dplayer-pre-clickable");
			}
		}
	}

	// ============================================================
	// 4. 文章页模式：重建为 标题 + 视频
	// ============================================================
	function rebuild() {
		if (built) return true;
		let h1 =
			document.querySelector("h1.post-title") || document.querySelector("h1");
		let players = Array.prototype.slice.call(
			document.querySelectorAll(".dplayer"),
		);
		if (!h1 || !players.length) return false;
		let hasVideo = players.some((p) => p.querySelector("video"));
		if (!hasVideo && Date.now() - startTime < 3000) return false;

		built = true;
		let shell = document.createElement("div");
		shell.id = SHELL_ID;

		let style = document.createElement("style");
		style.textContent = [
			`html,body{background:${PAGE_BG}!important;margin:0!important;padding:0!important;min-height:100vh;color:${PAGE_FG}}`,
			`#${SHELL_ID}{max-width:980px;margin:0 auto;padding:28px 16px 80px;box-sizing:border-box;font-family:${TITLE_FONT}}`,
			`#${SHELL_ID} h1{font-family:${TITLE_FONT};font-size:${TITLE_SIZE_DESKTOP};line-height:${TITLE_LH_DESKTOP};font-weight:400;color:${TITLE_COLOR};margin:0 0 22px;padding:0;border:0;word-break:break-all;background:none}`,
			`@media (max-width:767px){#${SHELL_ID} h1{font-size:${TITLE_SIZE_MOBILE};line-height:${TITLE_LH_MOBILE}}}`,
			`#${SHELL_ID} .dplayer{margin:0 auto 26px;width:100%!important;max-width:100%!important;box-sizing:border-box}`,
			`#${SHELL_ID} .dplayer .dplayer-video-wrap{max-height:calc(100vh - 60px)}`,
			// 下载按钮：播放器右上角悬浮圆钮（不占用控制条，设置/全屏保持原生布局）
			`#${SHELL_ID} .dplayer .dplayer-download-icon{position:absolute;top:10px;right:10px;z-index:30;width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;margin:0;flex:0 0 auto;opacity:1;outline:none;box-shadow:0 1px 4px rgba(0,0,0,.4)}`,
			`#${SHELL_ID} .dplayer .dplayer-download-icon:hover{background:rgba(0,0,0,.78)}`,
			`#${SHELL_ID} .dplayer .dplayer-download-icon svg{width:20px;height:20px;display:block}`,
			`#${SHELL_ID} .dplayer .dplayer-download-icon .dl-progress{font-size:12px;font-weight:600;color:#fff;white-space:nowrap;font-family:inherit}`,
			// 控制条常驻显示：播放/触摸时 DPlayer 会隐藏控制条（display:none + opacity 0），
			// 强制保持可见，保证下载/设置/全屏按钮随时可点
			`#${SHELL_ID} .dplayer .dplayer-controller, #${SHELL_ID} .dplayer .dplayer-controller.dplayer-controller-hide{display:block!important;opacity:1!important;visibility:visible!important}`,
			`#${SHELL_ID} .dplayer .dplayer-controller{pointer-events:auto!important}`,
			// 全屏播放时隐藏控制条，暂停时显现（dplayer-fs-hide 由脚本按播放状态切换）
			`#${SHELL_ID} .dplayer.dplayer-fs-hide .dplayer-controller{display:none!important;opacity:0!important;visibility:hidden!important}`,
		].join("\n");
		shell.appendChild(style);

		let title = document.createElement("h1");
		title.textContent = h1.textContent.replace(/\s+/g, " ").trim();
		shell.appendChild(title);

		players.forEach((p) => {
			if (p.querySelector("video")) p.__dpLoaded = true;
			shell.appendChild(p);
		});

		while (document.body.firstChild)
			document.body.removeChild(document.body.firstChild);
		document.body.appendChild(shell);
		removeTransitionCSS();
		if (title.textContent) document.title = title.textContent;

		startArticleGuard();
		installDownloadButtons();
		installTapPlay();
		installFsAutoHide();
		return true;
	}

	function startArticleGuard() {
		if (!document.body) {
			setTimeout(startArticleGuard, 16);
			return;
		}
		let obs = new MutationObserver((muts) => {
			muts.forEach((m) => {
				m.addedNodes.forEach((n) => {
					if (n?.nodeType !== 1) return;
					// 播放器内部：只清除片头广告图，其余不干预
					if (n.closest?.(".dplayer")) {
						let pre2 = n.querySelectorAll
							? n.querySelectorAll(".dplayer-pre-img")
							: [];
						for (let p2 = 0; p2 < pre2.length; p2++) pre2[p2].remove();
						if (n.classList)
							n.classList.remove(
								"dplayer-pre-playing",
								"dplayer-pre-clickable",
							);
						return;
					}
					let inside = n.id === SHELL_ID || n.closest?.(`#${SHELL_ID}`);
					if (inside) {
						if (isAdNode(n)) n.remove();
						return;
					}
					if (isAdNode(n) || /^IFRAME$/i.test(n.tagName)) n.remove();
				});
			});
		});
		obs.observe(document.body, { childList: true, subtree: true });
	}

	function startListGuard() {
		if (!document.body) {
			setTimeout(startListGuard, 16);
			return;
		}
		let obs = new MutationObserver((muts) => {
			muts.forEach((m) => {
				m.addedNodes.forEach((n) => {
					if (n?.nodeType !== 1) return;
					if (n.closest?.(".dplayer")) return;
					if (isAdNode(n)) {
						n.remove();
						return;
					}
					if (n.querySelectorAll) {
						for (let i = 0; i < AD_SELECTORS.length; i++) {
							let hits = n.querySelectorAll(AD_SELECTORS[i]);
							for (let j = 0; j < hits.length; j++) hits[j].remove();
						}
					}
				});
			});
		});
		obs.observe(document.body, { childList: true, subtree: true });
	}

	// ============================================================
	// 5. 列表页点击过渡
	// ============================================================
	function installClickShield() {
		if (!document.body) {
			setTimeout(installClickShield, 16);
			return;
		}
		document.addEventListener(
			"click",
			(e) => {
				let t = e.target;
				let a = t?.closest ? t.closest('a[href*="/archives/"]') : null;
				if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
				if (document.getElementById(MASK_ID)) return;
				let mask = document.createElement("div");
				mask.id = MASK_ID;
				mask.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;background:${PAGE_BG};z-index:2147483647;margin:0;padding:0;border:0;`;
				document.body.appendChild(mask);
				// 额外保险：3 秒后自动移除（导航正常时 pagehide 已移除；
				// 若链接被拦截/延迟跳转，遮罩也不会残留到返回场景）
				setTimeout(() => {
					let m = document.getElementById(MASK_ID);
					if (m) m.remove();
				}, 3000);
			},
			true,
		);
	}

	// ============================================================
	// 6. 视频下载按钮（DPlayer 控制条 · 设置按钮左侧）
	// ============================================================
	let DOWNLOAD_SVG =
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10.5l5 4.5 5-4.5"/><path d="M4 20h16"/></svg>';

	function installDownloadButtons() {
		let list = document.querySelectorAll(`#${SHELL_ID} .dplayer`);
		for (let i = 0; i < list.length; i++) {
			((dp) => {
				if (dp.__51dl_btn) return;
				dp.__51dl_btn = true;
				let tries = 0;
				let timer = setInterval(() => {
					// 等播放器渲染完成再挂悬浮按钮
					if (!dp.querySelector("video")) {
						if (++tries > 40) clearInterval(timer);
						return;
					}
					clearInterval(timer);
					if (dp.querySelector(".dplayer-download-icon")) return;
					let btn = document.createElement("button");
					btn.className = "dplayer-icon dplayer-download-icon";
					btn.title = "下载视频（再次点击取消）";
					btn.innerHTML = DOWNLOAD_SVG;
					btn.addEventListener("click", (e) => {
						e.stopPropagation();
						startDownload(dp, btn);
					});
					// 悬浮于播放器右上角：不占用控制条空间，设置/全屏保持原生布局
					dp.appendChild(btn);
				}, 250);
			})(list[i]);
		}
	}

	function btnIcon(btn) {
		btn.innerHTML = DOWNLOAD_SVG;
		btn.title = "下载视频（再次点击取消）";
	}

	function btnText(btn, txt) {
		btn.innerHTML = `<span class="dl-progress">${txt}</span>`;
	}

	// ============================================================
	// 6b. 移动端：点击视频画面 = 播放/暂停
	//     （排除控制条、下载按钮、进度条等交互区域，避免误触发）
	// ============================================================
	function installTapPlay() {
		let list = document.querySelectorAll(`#${SHELL_ID} .dplayer`);
		for (let i = 0; i < list.length; i++) {
			((dp) => {
				if (dp.__51bl_tap) return;
				dp.__51bl_tap = true;

				// 同步播放器 UI：播放时隐藏中央播放按钮与下载按钮，暂停时恢复
				let v = dp.querySelector("video");
				if (v && !v.__51bl_sync) {
					v.__51bl_sync = true;
					let syncUi = () => {
						let mp = dp.querySelector(".dplayer-mobile-play");
						let dl = dp.querySelector(".dplayer-download-icon");
						if (v.paused) {
							if (mp && mp.style.display === "none") mp.style.display = "";
							if (dl && dl.style.display === "none") dl.style.display = "";
						} else {
							if (mp) mp.style.display = "none";
							if (dl) dl.style.display = "none";
						}
					};
					v.addEventListener("play", syncUi);
					v.addEventListener("pause", syncUi);
					v.addEventListener("ended", syncUi);
				}

				dp.addEventListener(
					"click",
					(e) => {
						let t = e.target;
						if (!t?.closest) return;
						// 控制条/下载按钮/进度条/设置/全屏/弹幕等交互区不触发
						if (
							t.closest(
								".dplayer-controller, .dplayer-download-icon, .dplayer-mobile-play, .dplayer-setting, .dplayer-full, .dplayer-comment, .dplayer-bar-wrap, .dplayer-mask, .dplayer-video-wrap .dplayer-icon",
							)
						)
							return;
						let video = dp.querySelector("video");
						if (!video) return;
						if (video.paused) {
							// 优先走 DPlayer 原生播放按钮（触发其内部状态机，按钮自动隐藏）
							let mpBtn = dp.querySelector(".dplayer-mobile-play");
							if (mpBtn && mpBtn.style.display !== "none") {
								try {
									mpBtn.click();
								} catch (_e3) {}
							} else {
								try {
									video.play();
								} catch (_e3) {}
							}
						} else {
							try {
								video.pause();
							} catch (_e3) {}
						}
					},
					true,
				);
			})(list[i]);
		}
	}

	// ============================================================
	// 6c. 全屏模式：播放时自动隐藏控制条，暂停时显现
	//     （非全屏保持常驻显示）
	// ============================================================
	function installFsAutoHide() {
		let list = document.querySelectorAll(`#${SHELL_ID} .dplayer`);
		for (let i = 0; i < list.length; i++) {
			((dp) => {
				if (dp.__51bl_fs) return;
				dp.__51bl_fs = true;
				let v = dp.querySelector("video");
				if (!v) return;
				// 仅"用户点击全屏按钮"才启用全屏自动隐藏；
				// 部分 WebView（如 Via）在视频播放时会隐式触发 fullscreenchange，
				// 不能据此判定用户主动全屏，否则非全屏播放也会隐藏控制条。
				let userFs = false;
				dp.addEventListener(
					"click",
					(e) => {
						let t = e.target;
						if (t?.closest?.(".dplayer-full-icon, .dplayer-full-in-icon")) {
							userFs = true;
						}
					},
					true,
				);
				let update = () => {
					let fsEl =
						document.fullscreenElement || document.webkitFullscreenElement;
					if (!fsEl) userFs = false; // 已退出全屏
					let isThisFs =
						userFs &&
						!!fsEl &&
						(fsEl === dp || fsEl.contains(dp) || dp.contains(fsEl));
					if (isThisFs) {
						// 全屏中：播放隐藏、暂停显现
						if (v.paused) dp.classList.remove("dplayer-fs-hide");
						else dp.classList.add("dplayer-fs-hide");
					} else {
						dp.classList.remove("dplayer-fs-hide");
					}
				};
				document.addEventListener("fullscreenchange", update);
				document.addEventListener("webkitfullscreenchange", update);
				v.addEventListener("play", update);
				v.addEventListener("pause", update);
				v.addEventListener("ended", update);
				update();
			})(list[i]);
		}
	}

	// 下载状态机：__dlState 0=空闲 1=下载中；再次点击取消
	function startDownload(dp, btn) {
		if (btn.__dlState === 1) {
			if (btn.__dlCtrl) btn.__dlCtrl.abort();
			btnText(btn, "取消中");
			return;
		}
		let cfg = null;
		try {
			cfg = JSON.parse(dp.getAttribute("data-config"));
		} catch (_e) {}
		let url = cfg?.video?.url;
		if (!url) {
			btnText(btn, "无视频");
			setTimeout(() => {
				btnIcon(btn);
			}, 1800);
			return;
		}

		btn.__dlState = 1;
		btn.__dlCtrl = new AbortController();
		let ctrl = btn.__dlCtrl;
		let rawTitle =
			dp.getAttribute("data-video_title") || document.title || "video";
		let filename = rawTitle.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 80);
		btnText(btn, "0%");

		// 优先"另存为"流式写盘（实时进度、实时落盘）；用户取消对话框则降级浏览器下载
		let useFSA = false;
		let writable = null;
		let fsaHandle = null;
		let fsaReady = Promise.resolve(false);
		if (window.showSaveFilePicker) {
			try {
				fsaReady = window
					.showSaveFilePicker({
						suggestedName: `${filename}.ts`,
						types: [
							{
								description: "MPEG-TS 视频",
								accept: { "video/mp2t": [".ts"] },
							},
						],
					})
					.then((handle) => {
						fsaHandle = handle;
						return handle.createWritable();
					})
					.then((w) => {
						writable = w;
						useFSA = true;
						return true;
					})
					.catch(() => {
						return false; // 对话框取消/失败 → 降级 blob 下载
					});
			} catch (_e) {
				fsaReady = Promise.resolve(false);
			}
		}

		fetchPlaylistAndDownload(
			url,
			filename,
			ctrl,
			fsaReady,
			(p) => {
				btnText(btn, `${p}%`);
			},
			(blob, name) => {
				btn.__dlState = 0;
				btn.__dlCtrl = null;
				if (useFSA && writable) {
					// 流式写盘完成，文件已保存
					writable.close().catch(() => {});
					btnText(btn, "已保存");
					setTimeout(() => {
						btnIcon(btn);
					}, 2500);
				} else {
					// 移动端部分浏览器拒绝 blob: 下载（仅支持 https），
					// 优先用油猴 GM_download（扩展级下载通道，支持 blob/data）；
					// 不可用时回退 a[download]。
					try {
						let a = document.createElement("a");
						a.href = URL.createObjectURL(blob);
						a.download = name;
						let fired = false;
						if (typeof GM_download === "function") {
							try {
								GM_download({
									url: a.href,
									name: name,
									saveAs: false,
									onerror: () => {
										if (!fired) {
											fired = true;
											document.body.appendChild(a);
											a.click();
											setTimeout(() => {
												URL.revokeObjectURL(a.href);
												a.remove();
											}, 3000);
										}
									},
								});
								fired = true;
								setTimeout(() => {
									URL.revokeObjectURL(a.href);
									a.remove();
								}, 60000);
							} catch (_e) {
								fired = true;
								document.body.appendChild(a);
								a.click();
								setTimeout(() => {
									URL.revokeObjectURL(a.href);
									a.remove();
								}, 3000);
							}
						} else {
							document.body.appendChild(a);
							a.click();
							setTimeout(() => {
								URL.revokeObjectURL(a.href);
								a.remove();
							}, 3000);
						}
					} catch (_e) {}
					btnText(btn, "已下载");
					setTimeout(() => {
						btnIcon(btn);
					}, 2500);
				}
			},
			(err) => {
				btn.__dlState = 0;
				btn.__dlCtrl = null;
				if (useFSA && writable) {
					try {
						writable.abort();
					} catch (_e) {}
				}
				if (fsaHandle?.remove) {
					try {
						fsaHandle.remove();
					} catch (_e) {}
				}
				let msg = "失败";
				if (err && err.name === "AbortError") msg = "已取消";
				else if (err?.message)
					msg = String(err.message).replace(/"/g, "").slice(0, 16);
				btnText(btn, msg);
				setTimeout(() => {
					btnIcon(btn);
				}, 2500);
			},
		);
	}

	// ============================================================
	// 7. HLS 下载核心：m3u8 解析 + AES-128 解密 + 分段合并
	// ============================================================
	function fetchPlaylistAndDownload(
		m3u8Url,
		filename,
		ctrl,
		fsaReady,
		onProgress,
		onDone,
		onError,
	) {
		let req = (u, retries) => {
			retries = retries || 0;
			let ctrl2 = new AbortController();
			let onAbort = () => {
				ctrl2.abort();
			};
			ctrl.signal.addEventListener("abort", onAbort);
			let timer = setTimeout(() => {
				ctrl2.abort();
			}, 60000);
			return fetch(u, { signal: ctrl2.signal, cache: "no-store" })
				.then((r) => {
					clearTimeout(timer);
					ctrl.signal.removeEventListener("abort", onAbort);
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					return r.arrayBuffer();
				})
				.catch((e) => {
					clearTimeout(timer);
					ctrl.signal.removeEventListener("abort", onAbort);
					if (e && e.name === "AbortError") throw e;
					if (retries < 2) return req(u, retries + 1);
					throw e;
				});
		};

		fetch(m3u8Url, { signal: ctrl.signal, cache: "no-store" })
			.then((r) => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.text();
			})
			.then((playlist) => {
				let keyUrl = null,
					ivHex = null,
					mapUrl = null,
					segs = [];
				let lines = playlist.split(/\r?\n/);
				for (let i = 0; i < lines.length; i++) {
					let line = lines[i].trim();
					if (line.indexOf("#EXT-X-KEY") === 0) {
						let km = line.match(/METHOD=([^,\s]+)/);
						let um = line.match(/URI="([^"]+)"/);
						if (km && um && /AES-128/i.test(km[1])) {
							keyUrl = um[1];
							ivHex = (line.match(/IV=0x([0-9A-Fa-f]+)/) || [])[1] || null;
						}
					} else if (line.indexOf("#EXT-X-MAP") === 0) {
						let mm = line.match(/URI="([^"]+)"/);
						if (mm) mapUrl = mm[1];
					} else if (line.charAt(0) !== "#" && line.length > 0) {
						segs.push(line);
					}
				}
				if (!segs.length) throw new Error("no segments");

				let total = segs.length + (mapUrl ? 1 : 0);
				let doneCount = 0;
				let parts = [];
				let toAbs = (u) => new URL(u, m3u8Url).href;
				let progress = () => {
					onProgress(Math.round((doneCount / total) * 100));
				};

				// 写盘通道：FSA 流式或内存 Blob（fsaReady 完成前不开始下载链，
				// 避免用户未确认"另存为"时数据已进内存导致写盘缺段）
				let fsaState = { useFSA: false, writable: null };
				let writeChain = Promise.resolve();
				let writeChunk = (clear) => {
					if (fsaState.useFSA) {
						writeChain = writeChain.then(() => fsaState.writable.write(clear));
					} else {
						parts.push(clear);
					}
				};

				return fsaReady
					.then((ok) => {
						fsaState.useFSA = ok;
						fsaState.writable = ok ? writable : null;
						let work = Promise.resolve();
						if (mapUrl) {
							work = work
								.then(() => req(toAbs(mapUrl)))
								.then((buf) => {
									parts.push(buf);
									doneCount++;
									progress();
								});
						}
						let decryptor = null;
						if (keyUrl) {
							work = work
								.then(() => req(toAbs(keyUrl)))
								.then((keyBuf) =>
									crypto.subtle
										.importKey("raw", keyBuf, { name: "AES-CBC" }, false, [
											"decrypt",
										])
										.then((key) => {
											let iv = new Uint8Array(16);
											if (ivHex) {
												for (let j = 0; j < 16; j++)
													iv[j] = parseInt(ivHex.substr(j * 2, 2), 16);
											}
											decryptor = (buf) =>
												crypto.subtle.decrypt(
													{ name: "AES-CBC", iv: iv },
													key,
													buf,
												);
										}),
								);
						}
						segs.forEach((u) => {
							work = work
								.then(() => req(toAbs(u)))
								.then((buf) => {
									if (!decryptor) return buf;
									return decryptor(buf).catch(() => {
										let bust = `${toAbs(u) + (toAbs(u).indexOf("?") !== -1 ? "&" : "?")}_cb=${Date.now()}`;
										return req(bust).then((buf2) => decryptor(buf2));
									});
								})
								.then((clear) => {
									writeChunk(clear);
									doneCount++;
									progress();
								});
						});
						return work;
					})
					.then(() => {
						if (fsaState.useFSA && fsaState.writable) {
							return fsaState.writable.close().then(() => {
								onDone(null, `${filename}.ts`);
							});
						}
						onDone(new Blob(parts, { type: "video/mp2t" }), `${filename}.ts`);
					});
			})
			.catch((e) => {
				onError(e);
			});
	}

	function wireDownloadSink() {
		window.__51bl_download = (dpEl, btnEl) => {
			startDownload(dpEl, btnEl);
		};
	}

	// ============================================================
	// 启动
	// ============================================================
	function boot51() {
		try {
			window.__51bl_boot_ts = Date.now();
			window.__51bl_boot_perf = performance.now();
		} catch (_e) {}
		let _startTime = Date.now();
		if (IS_ARTICLE) injectTransitionCSS();
		injectHideCSS();
		injectPreHook();
		sanitizePlayerConfig();
		startListGuard();
		if (!IS_ARTICLE) installClickShield();
		wireDownloadSink();

		// bfcache 清理：点击视频链接时的全屏遮罩若残留会随页面进入往返缓存，
		// 返回恢复时遮罩盖住全屏导致"空白页"。导航离开前移除，恢复时兜底再清一次。
		window.addEventListener("pagehide", () => {
			let m = document.getElementById(MASK_ID);
			if (m) m.remove();
		});
		window.addEventListener("pageshow", () => {
			let m = document.getElementById(MASK_ID);
			if (m) m.remove();
			removeTransitionCSS();
		});

		let poll = setInterval(() => {
			sanitizePlayerConfig();
			try {
				cleanListPage();
			} catch (_e) {}
			try {
				removePreRollAds();
			} catch (_e) {}
			if (IS_ARTICLE && !built && rebuild()) clearInterval(poll);
		}, 80);
		setTimeout(() => {
			clearInterval(poll);
			try {
				if (!rebuild()) removeTransitionCSS();
			} catch (_e) {
				removeTransitionCSS();
			}
		}, 16000);

		window.addEventListener("load", () => {
			sanitizePlayerConfig();
			try {
				cleanListPage();
			} catch (_e) {}
			setTimeout(() => {
				try {
					if (!rebuild()) removeTransitionCSS();
				} catch (_e) {
					removeTransitionCSS();
				}
			}, 100);
		});
	}

	// 站点识别：51 爆料网会频繁更换镜像域名。
	// 已知域组直接启动；未知域名用 MutationObserver 即时识别——
	// 在 DOM 解析过程中（title/特征元素一插入）即触发，远早于页面渲染完成，
	// 保证视频页过渡 CSS 等依然能在广告闪现前生效。
	let KNOWN_HOST = /(^|\.)(qprvlexj\.com|rrvdjtsqc\.cc|ckoidelwg\.cc)$/i;
	if (
		KNOWN_HOST.test(location.hostname) ||
		location.hostname === "www.51baoliao01.com" ||
		location.hostname === "d1epqpoay27u74.cloudfront.net"
	) {
		boot51();
	} else {
		let started51 = false;
		let obs51 = null;
		let bootOnce = () => {
			if (started51) return;
			started51 = true;
			if (obs51) {
				try {
					obs51.disconnect();
				} catch (_e) {}
			}
			boot51();
		};
		let check51 = () => {
			let title = document.title || "";
			if (/51爆料网|51baoliao/i.test(title)) return true;
			if (
				/\/archives\/\d+/.test(location.pathname) &&
				document.querySelector(".dplayer")
			)
				return true;
			if (
				document.querySelector("#adFloat") &&
				document.querySelector(".tjtagmanager")
			)
				return true;
			if (
				document.querySelector("article.ad-item") &&
				document.querySelector(".xqbj-component-adfloat")
			)
				return true;
			return false;
		};
		// 立即检查（document-start 时 title 可能尚未解析，但路径特征可先判）
		if (check51()) {
			bootOnce();
		} else {
			let watch51 = () => {
				if (document.documentElement && !obs51) {
					obs51 = new MutationObserver(() => {
						if (check51()) bootOnce();
					});
					obs51.observe(document.documentElement, {
						childList: true,
						subtree: true,
						characterData: true,
					});
					if (check51()) bootOnce();
				}
			};
			watch51();
			let waitRoot51 = setInterval(() => {
				if (document.documentElement) {
					clearInterval(waitRoot51);
					watch51();
					if (check51()) bootOnce();
				}
			}, 5);
			// 兜底：页面加载完成后仍未识别则放弃（不干扰其他网站）
			window.addEventListener("load", () => {
				setTimeout(() => {
					if (!started51) {
						if (check51()) bootOnce();
						if (obs51) {
							try {
								obs51.disconnect();
							} catch (_e) {}
						}
					}
				}, 300);
			});
		}
	}
})();
