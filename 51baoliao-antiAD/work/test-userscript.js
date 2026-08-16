// jsdom 逻辑测试：加载真实 page.html，注入油猴脚本，验证重建 + 清洗 + 守卫
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "page.html"), "utf8");
const scriptSrc = fs.readFileSync(
  path.join(__dirname, "..", "outputs", "51baoliao-clean.user.js"),
  "utf8"
);

const dom = new JSDOM(html, {
  url: "https://brown.qprvlexj.com/archives/155445/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

// 模拟播放器初始化：给 .dplayer 塞一个 video 子节点并标记 __dpLoaded
for (const d of document.querySelectorAll(".dplayer")) {
  const v = document.createElement("video");
  d.appendChild(v);
  d.__dpLoaded = true;
}

// 执行油猴脚本（document-start 语义：这里直接跑）
window.eval(scriptSrc);

// 等待轮询重建（3 秒初始化窗口后立即重建）
setTimeout(() => {
  const shell = document.getElementById("clean-shell-v1");
  const results = {
    shellBuilt: !!shell,
    bodyChildren: [...document.body.children].map((e) => e.tagName + "#" + e.id),
    shellH1: shell ? shell.querySelector("h1").textContent.slice(0, 40) : null,
    playersInShell: shell ? shell.querySelectorAll(".dplayer").length : 0,
    videosInShell: shell ? shell.querySelectorAll(".dplayer video").length : 0,
    adNodesLeft:
      document.querySelectorAll(
        ".horizontal-banner,.txt-apps,.article-bottom-apps,.a2a_kit,.post-near,.btn-download,.float_buttom,#carouselContainerTop,.adspop,.side-toolbar,.navbar-sidebar"
      ).length,
    adsInConfig: [...document.querySelectorAll(".dplayer")].filter((d) => {
      try {
        const cfg = JSON.parse(d.getAttribute("data-config"));
        return !!cfg.video_player_ads;
      } catch (e) {
        return false;
      }
    }).length,
    adsSkipSet: [...document.querySelectorAll(".dplayer")].filter((d) => {
      try {
        const cfg = JSON.parse(d.getAttribute("data-config"));
        return cfg.ads_skip === "1";
      } catch (e) {
        return false;
      }
    }).length,
    hookInstalled: !!document.getElementById("__51bl_clean_hook__"),
  };
  console.log(JSON.stringify(results, null, 2));

  // 动态广告注入模拟：重建后 body 挂 .adspop 弹窗，守卫应清掉
  const popup = document.createElement("div");
  popup.className = "adspop";
  document.body.appendChild(popup);
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  setTimeout(() => {
    console.log(
      "guardAfterInjection:",
      JSON.stringify({
        adspop: document.querySelectorAll("body > .adspop").length,
        iframesInBody: document.querySelectorAll("body > iframe").length,
        shellIntact: !!document.getElementById("clean-shell-v1"),
      })
    );
    process.exit(0);
  }, 300);
}, 3600);
