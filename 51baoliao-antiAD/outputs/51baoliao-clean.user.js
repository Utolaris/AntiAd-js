// ==UserScript==
// @name         51爆料网纯净模式（文章页去广告 + 首页去广告）
// @namespace    local.fixtures.51baoliao-clean
// @version      1.5.3
// @description  51爆料网全站去广告：视频页纯背景过渡、仅保留标题+视频（标题字体与导航页一致）；DPlayer 控制条新增下载按钮（AES-128 解密合并，支持取消与实时进度，优先另存为流式写盘、降级浏览器下载）；首页/列表页移除浮点广告(#adFloat)、列表广告卡片(article.ad-item)等，点击视频链接纯色遮罩过渡。兼容桌面与安卓移动端。
// @author       local
// @match        https://*.qprvlexj.com/*
// @match        https://*.rrvdjtsqc.cc/*
// @match        https://www.51baoliao01.com/*
// @match        https://d1epqpoay27u74.cloudfront.net/*
// @run-at       document-start
// @grant        GM_download
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    var SHELL_ID = 'clean-shell-v1';
    var HOOK_ID = '__51bl_clean_hook__';
    var HIDE_CSS_ID = '__51bl_hide_css__';
    var TRANSITION_CSS_ID = '__51bl_transition_css__';
    var MASK_ID = '__51bl_transition__';
    var built = false;

    // ============================================================
    // 站点风格常量（采样自导航页 alcohol.qprvlexj.com）
    // ============================================================
    var PAGE_BG = '#2C2A2A';
    var PAGE_FG = '#F0F0F0';
    var TITLE_FONT = '"Mirages Custom", Merriweather, "Open Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft Yahei", "WenQuanYi Micro Hei", "Segoe UI Emoji", "Segoe UI Symbol", Helvetica, Arial, sans-serif';
    var TITLE_COLOR = '#FFFFFF';
    var TITLE_SIZE_DESKTOP = '25px';
    var TITLE_LH_DESKTOP = '28.75px';
    var TITLE_SIZE_MOBILE = '18.6px';
    var TITLE_LH_MOBILE = '21.39px';
    var IS_ARTICLE = /\/archives\//.test(location.pathname);

    // ============================================================
    // 0. 根注入辅助：document-start 极早注入时 documentElement 可能
    //    尚未创建，等待其就绪再挂载，避免 appendChild 抛错导致
    //    整个脚本崩溃（某些浏览器/扩展注入时机早于 html 解析）
    // ============================================================
    function appendRoot(el) {
        var root = document.head || document.documentElement;
        if (root) {
            root.appendChild(el);
            return;
        }
        var wait = setInterval(function () {
            var r2 = document.head || document.documentElement;
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
        var style = document.createElement('style');
        style.id = TRANSITION_CSS_ID;
        style.textContent = [
            'html, body { background: ' + PAGE_BG + ' !important; }',
            'body > * { visibility: hidden !important; }'
        ].join('\n');
        appendRoot(style);
    }

    function removeTransitionCSS() {
        var el = document.getElementById(TRANSITION_CSS_ID);
        if (el) el.remove();
    }

    // ============================================================
    // 0b. 广告隐藏 CSS
    // ============================================================
    function injectHideCSS() {
        if (document.getElementById(HIDE_CSS_ID)) return;
        var style = document.createElement('style');
        style.id = HIDE_CSS_ID;
        style.textContent = [
            '#adFloat, .xqbj-component-adfloat, article.ad-item',
            '.adspop, .popup-container, .modal-overlay, .float_buttom',
            '.horizontal-banner, #carouselContainerTop, .txt-apps',
            '.article-bottom-apps, .a2a_kit, .post-near, .btn-download',
            '.flash, .bling { display: none !important; }'
        ].join(',\n');
        appendRoot(style);
    }

    // ============================================================
    // 1. 主世界钩子：禁用 DPlayer 片头/暂停广告
    // ============================================================
    function injectPreHook() {
        if (document.getElementById(HOOK_ID)) return;
        var s = document.createElement('script');
        s.id = HOOK_ID;
        s.textContent = '(' + function () {
            try {
                Object.defineProperty(window, 'DPLAYER_PREROLL_AD', {
                    configurable: true,
                    get: function () { return window.__51bl_preroll_stub; },
                    set: function () {
                        window.__51bl_preroll_stub = {
                            pickAdConfig: function () { return null; },
                            attachPreRollAd: function () {},
                            patchVideoInline: function () {},
                            attachPauseAudioCleanup: function () {}
                        };
                    }
                });
            } catch (e) {}
            // 屏蔽导航页的原生询问弹窗（广告 confirm/alert 等）
            try { window.alert = function () {}; } catch (e) {}
            try { window.confirm = function () { return false; }; } catch (e) {}
            try { window.prompt = function () { return null; }; } catch (e) {}
            // 从源头拦截 "AI科技" 广告体系脚本（浮点广告/中转弹窗），
            // 这些脚本会动态创建浮标与弹窗并引导到登录/中转页
            try {
                var obsAd = new MutationObserver(function (muts) {
                    muts.forEach(function (m) {
                        m.addedNodes.forEach(function (n) {
                            if (n && n.tagName === 'SCRIPT' && n.src && /adfloat-entry|index-ai/.test(n.src)) {
                                n.remove();
                            }
                        });
                    });
                });
                if (document.documentElement) obsAd.observe(document.documentElement, { childList: true, subtree: true });
            } catch (e) {}
        }.toString() + ')();';
        appendRoot(s);
    }

    // ============================================================
    // 2. 清洗 .dplayer 的 data-config
    // ============================================================
    function sanitizePlayerConfig() {
        var list = document.querySelectorAll('.dplayer');
        for (var i = 0; i < list.length; i++) {
            var el = list[i];
            if (el.__51bl_clean) continue;
            var raw = el.getAttribute('data-config');
            if (!raw) continue;
            try {
                var cfg = JSON.parse(raw);
                var changed = false;
                // 只删除明确的播放器广告字段，避免误删 download/preload 等含 "ad" 子串的普通配置
                Object.keys(cfg).forEach(function (k) {
                    var adField = /^(ad|ads|advert|preroll)/i.test(k) || /video_player_ads/i.test(k) || /_ads?$/i.test(k);
                    if (adField && k !== 'ads_skip') {
                        delete cfg[k];
                        changed = true;
                    }
                });
                if (cfg.ads_skip !== '1' && cfg.ads_skip !== 1) {
                    cfg.ads_skip = '1';
                    changed = true;
                }
                if (changed) el.setAttribute('data-config', JSON.stringify(cfg));
                el.__51bl_clean = true;
            } catch (e) {}
        }
    }

    // ============================================================
    // 3. 通用广告判定与清理
    // ============================================================
    var AD_SELECTORS = [
        '#adFloat', '.xqbj-component-adfloat', 'article.ad-item',
        '.adspop', '.popup-container', '.modal-overlay', '.float_buttom',
        '.horizontal-banner', '#carouselContainerTop', '.txt-apps',
        '.article-bottom-apps', '.a2a_kit', '.post-near', '.btn-download',
        '.flash', '.bling'
    ];

    function isAdNode(n) {
        if (!n || n.nodeType !== 1) return false;
        if (n.id === SHELL_ID) return false;
        // DPlayer 播放器内部（含我们注入的下载按钮）永远不参与广告判定
        var inPlayer = (n.classList && n.classList.contains('dplayer')) || (n.closest && n.closest('.dplayer'));
        if (inPlayer) return false;
        if (n.id === 'adFloat' || /xqbj-component-adfloat/.test(String(n.className || ''))) return true;
        if (/ad-item/.test(String(n.className || ''))) return true;
        var c = String(n.className || '');
        if (/adspop|popup-container|modal-overlay|float_buttom|horizontal-banner|txt-apps|article-bottom-apps|a2a_kit|post-near|btn-download|carousel|flash|bling/i.test(c)) return true;
        return false;
    }

    function removeAds() {
        for (var i = 0; i < AD_SELECTORS.length; i++) {
            var els = document.querySelectorAll(AD_SELECTORS[i]);
            for (var j = 0; j < els.length; j++) {
                var el = els[j];
                if (!el || el.id === SHELL_ID) continue;
                if (el.closest && el.closest('.dplayer')) continue; // 不碰播放器内部
                el.remove();
            }
        }
    }

    function cleanListPage() {
        removeAds();
        var ads = document.querySelectorAll('article.ad-item');
        for (var i = 0; i < ads.length; i++) ads[i].remove();
    }

    // DPlayer 片头广告专项清除：dplayer-pre-img 是播放前广告图。
    // 即使 data-config 清洗未赶上初始化（广告已创建），也强制移除并恢复播放器状态。
    function removePreRollAds() {
        var list = document.querySelectorAll('.dplayer');
        for (var i = 0; i < list.length; i++) {
            var dp = list[i];
            var pre = dp.querySelector('.dplayer-pre-img');
            if (pre) pre.remove();
            if (dp.classList) {
                dp.classList.remove('dplayer-pre-playing', 'dplayer-pre-clickable');
            }
        }
    }

    // ============================================================
    // 4. 文章页模式：重建为 标题 + 视频
    // ============================================================
    function rebuild() {
        if (built) return true;
        var h1 = document.querySelector('h1.post-title') || document.querySelector('h1');
        var players = Array.prototype.slice.call(document.querySelectorAll('.dplayer'));
        if (!h1 || !players.length) return false;
        var hasVideo = players.some(function (p) { return p.querySelector('video'); });
        if (!hasVideo && Date.now() - startTime < 3000) return false;

        built = true;
        var shell = document.createElement('div');
        shell.id = SHELL_ID;

        var style = document.createElement('style');
        style.textContent = [
            'html,body{background:' + PAGE_BG + '!important;margin:0!important;padding:0!important;min-height:100vh;color:' + PAGE_FG + '}',
            '#' + SHELL_ID + '{max-width:980px;margin:0 auto;padding:28px 16px 80px;box-sizing:border-box;font-family:' + TITLE_FONT + '}',
            '#' + SHELL_ID + ' h1{font-family:' + TITLE_FONT + ';font-size:' + TITLE_SIZE_DESKTOP + ';line-height:' + TITLE_LH_DESKTOP + ';font-weight:400;color:' + TITLE_COLOR + ';margin:0 0 22px;padding:0;border:0;word-break:break-all;background:none}',
            '@media (max-width:767px){#' + SHELL_ID + ' h1{font-size:' + TITLE_SIZE_MOBILE + ';line-height:' + TITLE_LH_MOBILE + '}}',
            '#' + SHELL_ID + ' .dplayer{margin:0 auto 26px;width:100%!important;max-width:100%!important;box-sizing:border-box}',
            '#' + SHELL_ID + ' .dplayer .dplayer-video-wrap{max-height:calc(100vh - 60px)}',
            // 下载按钮：播放器右上角悬浮圆钮（不占用控制条，设置/全屏保持原生布局）
            '#' + SHELL_ID + ' .dplayer .dplayer-download-icon{position:absolute;top:10px;right:10px;z-index:30;width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;margin:0;flex:0 0 auto;opacity:1;outline:none;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
            '#' + SHELL_ID + ' .dplayer .dplayer-download-icon:hover{background:rgba(0,0,0,.78)}',
            '#' + SHELL_ID + ' .dplayer .dplayer-download-icon svg{width:20px;height:20px;display:block}',
            '#' + SHELL_ID + ' .dplayer .dplayer-download-icon .dl-progress{font-size:12px;font-weight:600;color:#fff;white-space:nowrap;font-family:inherit}',
            // 控制条常驻显示：播放/触摸时 DPlayer 会隐藏控制条（display:none + opacity 0），
            // 强制保持可见，保证下载/设置/全屏按钮随时可点
            '#' + SHELL_ID + ' .dplayer .dplayer-controller, #' + SHELL_ID + ' .dplayer .dplayer-controller.dplayer-controller-hide{display:block!important;opacity:1!important;visibility:visible!important}',
            '#' + SHELL_ID + ' .dplayer .dplayer-controller{pointer-events:auto!important}'
        ].join('\n');
        shell.appendChild(style);

        var title = document.createElement('h1');
        title.textContent = h1.textContent.replace(/\s+/g, ' ').trim();
        shell.appendChild(title);

        players.forEach(function (p) {
            if (p.querySelector('video')) p.__dpLoaded = true;
            shell.appendChild(p);
        });

        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        document.body.appendChild(shell);
        removeTransitionCSS();
        if (title.textContent) document.title = title.textContent;

        startArticleGuard();
        installDownloadButtons();
        installTapPlay();
        return true;
    }

    function startArticleGuard() {
        if (!document.body) { setTimeout(startArticleGuard, 16); return; }
        var obs = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                m.addedNodes.forEach(function (n) {
                    if (!n || n.nodeType !== 1) return;
                    // 播放器内部：只清除片头广告图，其余不干预
                    if (n.closest && n.closest('.dplayer')) {
                        var pre2 = n.querySelectorAll ? n.querySelectorAll('.dplayer-pre-img') : [];
                        for (var p2 = 0; p2 < pre2.length; p2++) pre2[p2].remove();
                        if (n.classList) n.classList.remove('dplayer-pre-playing', 'dplayer-pre-clickable');
                        return;
                    }
                    var inside = n.id === SHELL_ID || (n.closest && n.closest('#' + SHELL_ID));
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
        if (!document.body) { setTimeout(startListGuard, 16); return; }
        var obs = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                m.addedNodes.forEach(function (n) {
                    if (!n || n.nodeType !== 1) return;
                    if (n.closest && n.closest('.dplayer')) return;
                    if (isAdNode(n)) { n.remove(); return; }
                    if (n.querySelectorAll) {
                        for (var i = 0; i < AD_SELECTORS.length; i++) {
                            var hits = n.querySelectorAll(AD_SELECTORS[i]);
                            for (var j = 0; j < hits.length; j++) hits[j].remove();
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
        if (!document.body) { setTimeout(installClickShield, 16); return; }
        document.addEventListener('click', function (e) {
            var t = e.target;
            var a = t && t.closest ? t.closest('a[href*="/archives/"]') : null;
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            if (document.getElementById(MASK_ID)) return;
            var mask = document.createElement('div');
            mask.id = MASK_ID;
            mask.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:' + PAGE_BG + ';z-index:2147483647;margin:0;padding:0;border:0;';
            document.body.appendChild(mask);
        }, true);
    }

    // ============================================================
    // 6. 视频下载按钮（DPlayer 控制条 · 设置按钮左侧）
    // ============================================================
    var DOWNLOAD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10.5l5 4.5 5-4.5"/><path d="M4 20h16"/></svg>';

    function installDownloadButtons() {
        var list = document.querySelectorAll('#' + SHELL_ID + ' .dplayer');
        for (var i = 0; i < list.length; i++) {
            (function (dp) {
                if (dp.__51dl_btn) return;
                dp.__51dl_btn = true;
                var tries = 0;
                var timer = setInterval(function () {
                    // 等播放器渲染完成再挂悬浮按钮
                    if (!dp.querySelector('video')) {
                        if (++tries > 40) clearInterval(timer);
                        return;
                    }
                    clearInterval(timer);
                    if (dp.querySelector('.dplayer-download-icon')) return;
                    var btn = document.createElement('button');
                    btn.className = 'dplayer-icon dplayer-download-icon';
                    btn.title = '下载视频（再次点击取消）';
                    btn.innerHTML = DOWNLOAD_SVG;
                    btn.addEventListener('click', function (e) {
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
        btn.title = '下载视频（再次点击取消）';
    }

    function btnText(btn, txt) {
        btn.innerHTML = '<span class="dl-progress">' + txt + '</span>';
    }

    // ============================================================
    // 6b. 移动端：点击视频画面 = 播放/暂停
    //     （排除控制条、下载按钮、进度条等交互区域，避免误触发）
    // ============================================================
    function installTapPlay() {
        var list = document.querySelectorAll('#' + SHELL_ID + ' .dplayer');
        for (var i = 0; i < list.length; i++) {
            (function (dp) {
                if (dp.__51bl_tap) return;
                dp.__51bl_tap = true;

                // 同步播放器 UI：播放时隐藏中央播放按钮与下载按钮，暂停时恢复
                var v = dp.querySelector('video');
                if (v && !v.__51bl_sync) {
                    v.__51bl_sync = true;
                    var syncUi = function () {
                        var mp = dp.querySelector('.dplayer-mobile-play');
                        var dl = dp.querySelector('.dplayer-download-icon');
                        if (v.paused) {
                            if (mp && mp.style.display === 'none') mp.style.display = '';
                            if (dl && dl.style.display === 'none') dl.style.display = '';
                        } else {
                            if (mp) mp.style.display = 'none';
                            if (dl) dl.style.display = 'none';
                        }
                    };
                    v.addEventListener('play', syncUi);
                    v.addEventListener('pause', syncUi);
                    v.addEventListener('ended', syncUi);
                }

                dp.addEventListener('click', function (e) {
                    var t = e.target;
                    if (!t || !t.closest) return;
                    // 控制条/下载按钮/进度条/设置/全屏/弹幕等交互区不触发
                    if (t.closest('.dplayer-controller, .dplayer-download-icon, .dplayer-mobile-play, .dplayer-setting, .dplayer-full, .dplayer-comment, .dplayer-bar-wrap, .dplayer-mask, .dplayer-video-wrap .dplayer-icon')) return;
                    var video = dp.querySelector('video');
                    if (!video) return;
                    if (video.paused) {
                        // 优先走 DPlayer 原生播放按钮（触发其内部状态机，按钮自动隐藏）
                        var mpBtn = dp.querySelector('.dplayer-mobile-play');
                        if (mpBtn && mpBtn.style.display !== 'none') { try { mpBtn.click(); } catch (e3) {} }
                        else { try { video.play(); } catch (e3) {} }
                    } else {
                        try { video.pause(); } catch (e3) {}
                    }
                }, true);
            })(list[i]);
        }
    }

    // 下载状态机：__dlState 0=空闲 1=下载中；再次点击取消
    function startDownload(dp, btn) {
        if (btn.__dlState === 1) {
            if (btn.__dlCtrl) btn.__dlCtrl.abort();
            btnText(btn, '取消中');
            return;
        }
        var cfg = null;
        try { cfg = JSON.parse(dp.getAttribute('data-config')); } catch (e) {}
        var url = cfg && cfg.video && cfg.video.url;
        if (!url) { btnText(btn, '无视频'); setTimeout(function () { btnIcon(btn); }, 1800); return; }

        btn.__dlState = 1;
        btn.__dlCtrl = new AbortController();
        var ctrl = btn.__dlCtrl;
        var rawTitle = dp.getAttribute('data-video_title') || document.title || 'video';
        var filename = rawTitle.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80);
        btnText(btn, '0%');

        // 优先"另存为"流式写盘（实时进度、实时落盘）；用户取消对话框则降级浏览器下载
        var useFSA = false;
        var writable = null;
        var fsaHandle = null;
        var fsaReady = Promise.resolve(false);
        if (window.showSaveFilePicker) {
            try {
                fsaReady = window.showSaveFilePicker({
                    suggestedName: filename + '.ts',
                    types: [{ description: 'MPEG-TS 视频', accept: { 'video/mp2t': ['.ts'] } }]
                }).then(function (handle) {
                    fsaHandle = handle;
                    return handle.createWritable();
                }).then(function (w) {
                    writable = w;
                    useFSA = true;
                    return true;
                }).catch(function () {
                    return false; // 对话框取消/失败 → 降级 blob 下载
                });
            } catch (e) {
                fsaReady = Promise.resolve(false);
            }
        }

        fetchPlaylistAndDownload(url, filename, ctrl, fsaReady, function (p) {
            btnText(btn, p + '%');
        }, function (blob, name) {
            btn.__dlState = 0;
            btn.__dlCtrl = null;
            if (useFSA && writable) {
                // 流式写盘完成，文件已保存
                writable.close().catch(function () {});
                btnText(btn, '已保存');
                setTimeout(function () { btnIcon(btn); }, 2500);
            } else {
                // 移动端部分浏览器拒绝 blob: 下载（仅支持 https），
                // 优先用油猴 GM_download（扩展级下载通道，支持 blob/data）；
                // 不可用时回退 a[download]。
                try {
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = name;
                    var fired = false;
                    if (typeof GM_download === 'function') {
                        try {
                            GM_download({
                                url: a.href,
                                name: name,
                                saveAs: false,
                                onerror: function () {
                                    if (!fired) { fired = true; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000); }
                                }
                            });
                            fired = true;
                            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
                        } catch (e) {
                            fired = true;
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
                        }
                    } else {
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
                    }
                } catch (e) {}
                btnText(btn, '已下载');
                setTimeout(function () { btnIcon(btn); }, 2500);
            }
        }, function (err) {
            btn.__dlState = 0;
            btn.__dlCtrl = null;
            if (useFSA && writable) { try { writable.abort(); } catch (e) {} }
            if (fsaHandle && fsaHandle.remove) { try { fsaHandle.remove(); } catch (e) {} }
            var msg = '失败';
            if (err && err.name === 'AbortError') msg = '已取消';
            else if (err && err.message) msg = String(err.message).replace(/"/g, '').slice(0, 16);
            btnText(btn, msg);
            setTimeout(function () { btnIcon(btn); }, 2500);
        });
    }

    // ============================================================
    // 7. HLS 下载核心：m3u8 解析 + AES-128 解密 + 分段合并
    // ============================================================
    function fetchPlaylistAndDownload(m3u8Url, filename, ctrl, fsaReady, onProgress, onDone, onError) {
        var req = function (u, retries) {
            retries = retries || 0;
            var ctrl2 = new AbortController();
            var onAbort = function () { ctrl2.abort(); };
            ctrl.signal.addEventListener('abort', onAbort);
            var timer = setTimeout(function () { ctrl2.abort(); }, 60000);
            return fetch(u, { signal: ctrl2.signal, cache: 'no-store' }).then(function (r) {
                clearTimeout(timer);
                ctrl.signal.removeEventListener('abort', onAbort);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.arrayBuffer();
            }).catch(function (e) {
                clearTimeout(timer);
                ctrl.signal.removeEventListener('abort', onAbort);
                if (e && e.name === 'AbortError') throw e;
                if (retries < 2) return req(u, retries + 1);
                throw e;
            });
        };

        fetch(m3u8Url, { signal: ctrl.signal, cache: 'no-store' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        }).then(function (playlist) {
            var keyUrl = null, ivHex = null, mapUrl = null, segs = [];
            var lines = playlist.split(/\r?\n/);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.indexOf('#EXT-X-KEY') === 0) {
                    var km = line.match(/METHOD=([^,\s]+)/);
                    var um = line.match(/URI="([^"]+)"/);
                    if (km && um && /AES-128/i.test(km[1])) {
                        keyUrl = um[1];
                        ivHex = (line.match(/IV=0x([0-9A-Fa-f]+)/) || [])[1] || null;
                    }
                } else if (line.indexOf('#EXT-X-MAP') === 0) {
                    var mm = line.match(/URI="([^"]+)"/);
                    if (mm) mapUrl = mm[1];
                } else if (line.charAt(0) !== '#' && line.length > 0) {
                    segs.push(line);
                }
            }
            if (!segs.length) throw new Error('no segments');

            var total = segs.length + (mapUrl ? 1 : 0);
            var doneCount = 0;
            var parts = [];
            var toAbs = function (u) { return new URL(u, m3u8Url).href; };
            var progress = function () { onProgress(Math.round(doneCount / total * 100)); };

            // 写盘通道：FSA 流式或内存 Blob（fsaReady 完成前不开始下载链，
            // 避免用户未确认"另存为"时数据已进内存导致写盘缺段）
            var fsaState = { useFSA: false, writable: null };
            var writeChain = Promise.resolve();
            var writeChunk = function (clear) {
                if (fsaState.useFSA) {
                    writeChain = writeChain.then(function () { return fsaState.writable.write(clear); });
                } else {
                    parts.push(clear);
                }
            };

            return fsaReady.then(function (ok) {
                fsaState.useFSA = ok;
                fsaState.writable = ok ? writable : null;
                var work = Promise.resolve();
                if (mapUrl) {
                    work = work.then(function () { return req(toAbs(mapUrl)); }).then(function (buf) {
                        parts.push(buf); doneCount++; progress();
                    });
                }
                var decryptor = null;
                if (keyUrl) {
                    work = work.then(function () { return req(toAbs(keyUrl)); }).then(function (keyBuf) {
                        return crypto.subtle.importKey('raw', keyBuf, { name: 'AES-CBC' }, false, ['decrypt']).then(function (key) {
                            var iv = new Uint8Array(16);
                            if (ivHex) {
                                for (var j = 0; j < 16; j++) iv[j] = parseInt(ivHex.substr(j * 2, 2), 16);
                            }
                            decryptor = function (buf) {
                                return crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, key, buf);
                            };
                        });
                    });
                }
                segs.forEach(function (u) {
                    work = work.then(function () { return req(toAbs(u)); }).then(function (buf) {
                        if (!decryptor) return buf;
                        return decryptor(buf).catch(function () {
                            var bust = toAbs(u) + (toAbs(u).indexOf('?') !== -1 ? '&' : '?') + '_cb=' + Date.now();
                            return req(bust).then(function (buf2) { return decryptor(buf2); });
                        });
                    }).then(function (clear) {
                        writeChunk(clear);
                        doneCount++; progress();
                    });
                });
                return work;
            }).then(function () {
                if (fsaState.useFSA && fsaState.writable) {
                    return fsaState.writable.close().then(function () {
                        onDone(null, filename + '.ts');
                    });
                }
                onDone(new Blob(parts, { type: 'video/mp2t' }), filename + '.ts');
            });
        }).catch(function (e) {
            onError(e);
        });
    }

    function wireDownloadSink() {
        window.__51bl_download = function (dpEl, btnEl) { startDownload(dpEl, btnEl); };
    }

    // ============================================================
    // 启动
    // ============================================================
    var startTime = Date.now();
    if (IS_ARTICLE) injectTransitionCSS();
    injectHideCSS();
    injectPreHook();
    sanitizePlayerConfig();
    startListGuard();
    if (!IS_ARTICLE) installClickShield();
    wireDownloadSink();

    // bfcache 清理：点击视频链接时的全屏遮罩若残留会随页面进入往返缓存，
    // 返回恢复时遮罩盖住全屏导致"空白页"。导航离开前移除，恢复时兜底再清一次。
    window.addEventListener('pagehide', function () {
        var m = document.getElementById(MASK_ID);
        if (m) m.remove();
    });
    window.addEventListener('pageshow', function () {
        var m = document.getElementById(MASK_ID);
        if (m) m.remove();
        removeTransitionCSS();
    });

    var poll = setInterval(function () {
        sanitizePlayerConfig();
        try { cleanListPage(); } catch (e) {}
        try { removePreRollAds(); } catch (e) {}
        if (IS_ARTICLE && !built && rebuild()) clearInterval(poll);
    }, 80);
    setTimeout(function () {
        clearInterval(poll);
        try {
            if (!rebuild()) removeTransitionCSS();
        } catch (e) {
            removeTransitionCSS();
        }
    }, 16000);

    window.addEventListener('load', function () {
        sanitizePlayerConfig();
        try { cleanListPage(); } catch (e) {}
        setTimeout(function () {
            try {
                if (!rebuild()) removeTransitionCSS();
            } catch (e) {
                removeTransitionCSS();
            }
        }, 100);
    });
})();
