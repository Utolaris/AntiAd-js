// 三个镜像站 jsdom 测试：加载各站真实 HTML，注入油猴脚本，验证重建 + 清洗
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const scriptSrc = fs.readFileSync(
  path.join(__dirname, "..", "outputs", "51baoliao-clean.user.js"),
  "utf8"
);

const files = [
  "alcohol.qprvlexj.com.html",
  "birth.qprvlexj.com.html",
  "d1epqpoay27u74.cloudfront.net.html",
];

function testOne(file, url) {
  return new Promise((resolve) => {
    const html = fs.readFileSync(path.join(__dirname, "mirrors", file), "utf8");
    const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
    const { document } = dom.window;

    for (const d of document.querySelectorAll(".dplayer")) {
      const v = document.createElement("video");
      d.appendChild(v);
      d.__dpLoaded = true;
    }
    dom.window.eval(scriptSrc);

    setTimeout(() => {
      const shell = document.getElementById("clean-shell-v1");
      const result = {
        file,
        shellBuilt: !!shell,
        bodyOnlyShell: !!shell && document.body.children.length === 1,
        h1: shell ? shell.querySelector("h1").textContent.slice(0, 30) : null,
        players: shell ? shell.querySelectorAll(".dplayer").length : 0,
        videos: shell ? shell.querySelectorAll(".dplayer video").length : 0,
        adNodesLeft: document.querySelectorAll(
          ".horizontal-banner,.txt-apps,.article-bottom-apps,.a2a_kit,.post-near,.btn-download,.float_buttom,#carouselContainerTop,.adspop,.side-toolbar,.navbar-sidebar"
        ).length,
        adsInConfig: [...document.querySelectorAll(".dplayer")].filter((d) => {
          try { return !!JSON.parse(d.getAttribute("data-config")).video_player_ads; }
          catch (e) { return false; }
        }).length,
        adsSkipSet: [...document.querySelectorAll(".dplayer")].filter((d) => {
          try { return JSON.parse(d.getAttribute("data-config")).ads_skip === "1"; }
          catch (e) { return false; }
        }).length,
        hook: !!document.getElementById("__51bl_clean_hook__"),
      };
      resolve(result);
    }, 3600);
  });
}

(async () => {
  const results = await Promise.all([
    testOne(files[0], "https://alcohol.qprvlexj.com/archives/155187/"),
    testOne(files[1], "https://birth.qprvlexj.com/archives/155527/"),
    testOne(files[2], "https://d1epqpoay27u74.cloudfront.net/archives/155175/"),
  ]);
  console.log(JSON.stringify(results, null, 2));
  const allPass = results.every(
    (r) =>
      r.shellBuilt && r.bodyOnlyShell && r.players === r.videos &&
      r.adNodesLeft === 0 && r.adsInConfig === 0 && r.adsSkipSet === r.players && r.hook
  );
  console.log("ALL_PASS:", allPass);
  process.exit(0);
})();
