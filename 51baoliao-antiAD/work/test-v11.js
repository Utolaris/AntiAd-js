// v1.1.0 综合测试：首页列表模式 + 文章页重建回归 + 动态广告守卫
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const scriptSrc = fs.readFileSync(path.join(ROOT, "outputs", "51baoliao-clean.user.js"), "utf8");

// ---------- 首页测试 ----------
function testHome() {
  return new Promise((resolve) => {
    const html = fs.readFileSync(path.join(ROOT, "work", "home", "desk.html"), "utf8");
    const dom = new JSDOM(html, {
      url: "https://alcohol.qprvlexj.com/",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    });
    const { document } = dom.window;
    dom.window.eval(scriptSrc);

    setTimeout(() => {
      const normalCards = document.querySelectorAll(
        'article[itemtype="http://schema.org/BlogPosting"]'
      ).length;
      const adItems = document.querySelectorAll("article.ad-item").length;
      const adFloat = document.querySelectorAll("#adFloat, .xqbj-component-adfloat").length;
      const ads = document.querySelectorAll(
        ".adspop,.popup-container,.modal-overlay,.float_buttom,.horizontal-banner,#carouselContainerTop,.txt-apps,.article-bottom-apps,.a2a_kit,.btn-download"
      ).length;
      const result = {
        normalCards,
        adItems,
        adFloat,
        ads,
        listIntact: normalCards > 0 && adItems === 0 && adFloat === 0 && ads === 0,
      };

      // 动态注入守卫：模拟 adfloat-entry.js 延迟注入浮标 + 列表广告
      const f = document.createElement("div");
      f.id = "adFloat";
      f.className = "xqbj-component-adfloat";
      document.body.appendChild(f);
      const ad = document.createElement("article");
      ad.className = "ad-item";
      document.body.appendChild(ad);
      setTimeout(() => {
        result.afterInjection = {
          adFloat: document.querySelectorAll("#adFloat").length,
          adItems: document.querySelectorAll("article.ad-item").length,
          normalCardsStill: document.querySelectorAll(
            'article[itemtype="http://schema.org/BlogPosting"]'
          ).length,
        };
        result.guardWorks =
          result.afterInjection.adFloat === 0 &&
          result.afterInjection.adItems === 0 &&
          result.afterInjection.normalCardsStill === result.normalCards;
        resolve(result);
      }, 400);
    }, 500);
  });
}

// ---------- 文章页回归测试 ----------
function testArticle(file, url, hasPlayers) {
  return new Promise((resolve) => {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
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
      resolve({
        file,
        shellBuilt: !!shell,
        bodyOnlyShell: !!shell && document.body.children.length === 1,
        players: shell ? shell.querySelectorAll(".dplayer").length : 0,
        adsInConfig: [...document.querySelectorAll(".dplayer")].filter((d) => {
          try { return !!JSON.parse(d.getAttribute("data-config")).video_player_ads; }
          catch (e) { return false; }
        }).length,
        adsSkipSet: [...document.querySelectorAll(".dplayer")].filter((d) => {
          try { return JSON.parse(d.getAttribute("data-config")).ads_skip === "1"; }
          catch (e) { return false; }
        }).length,
      });
    }, 3700);
  });
}

(async () => {
  const home = await testHome();
  console.log("HOME:", JSON.stringify(home, null, 1));

  const arts = await Promise.all([
    testArticle("page.html", "https://brown.qprvlexj.com/archives/155445/"),
    testArticle("work/mirrors/alcohol.qprvlexj.com.html", "https://alcohol.qprvlexj.com/archives/155187/"),
    testArticle("work/mirrors/birth.qprvlexj.com.html", "https://birth.qprvlexj.com/archives/155527/"),
    testArticle("work/mirrors/d1epqpoay27u74.cloudfront.net.html", "https://d1epqpoay27u74.cloudfront.net/archives/155175/"),
  ]);
  console.log("ARTICLES:", JSON.stringify(arts, null, 1));

  const artPass = arts.every(
    (a) => a.shellBuilt && a.bodyOnlyShell && a.adsInConfig === 0 && a.adsSkipSet === a.players && a.players > 0
  );
  console.log("ALL_PASS:", home.listIntact && home.guardWorks && artPass);
  process.exit(0);
})();
