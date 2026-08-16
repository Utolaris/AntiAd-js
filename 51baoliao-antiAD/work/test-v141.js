// v1.4.1 结构验证：按钮插入位置（icons-right 直接子级）、控制条完整性、取消状态机
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const scriptSrc = fs.readFileSync(path.join(ROOT, "outputs", "51baoliao-clean.user.js"), "utf8");

const html = fs.readFileSync(path.join(ROOT, "page.html"), "utf8");
const dom = new JSDOM(html, {
  url: "https://alcohol.qprvlexj.com/archives/155187/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { document } = dom.window;

// 模拟播放器初始化 + 控制条（DPlayer 定制版结构）
for (const d of document.querySelectorAll(".dplayer")) {
  const v = document.createElement("video");
  d.appendChild(v);
  d.__dpLoaded = true;
  // 控制条
  const controller = document.createElement("div");
  controller.className = "dplayer-controller";
  const iconsRight = document.createElement("div");
  iconsRight.className = "dplayer-icons dplayer-icons-right";
  const airplay = document.createElement("div");
  airplay.className = "dplayer-icon dplayer-airplay-icon";
  const comment = document.createElement("div");
  comment.className = "dplayer-comment";
  const settingBox = document.createElement("div");
  settingBox.className = "dplayer-setting";
  const settingBtn = document.createElement("button");
  settingBtn.className = "dplayer-icon dplayer-setting-icon";
  settingBox.appendChild(settingBtn);
  const fullBox = document.createElement("div");
  fullBox.className = "dplayer-full";
  const fullBtn = document.createElement("button");
  fullBtn.className = "dplayer-icon dplayer-full-icon";
  fullBox.appendChild(fullBtn);
  iconsRight.append(airplay, comment, settingBox, fullBox);
  controller.appendChild(iconsRight);
  d.appendChild(controller);
}

// mock fetch 以支持下载状态机（挂起直到 abort）
dom.window.fetch = (url, opts) =>
  new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("aborted", "AbortError"));
    if (opts && opts.signal) {
      if (opts.signal.aborted) return onAbort();
      opts.signal.addEventListener("abort", onAbort);
    }
  });
dom.window.crypto.subtle = {
  importKey: () => Promise.resolve({}),
  decrypt: () => Promise.resolve(new ArrayBuffer(16)),
};

dom.window.eval(scriptSrc);

setTimeout(() => {
  const shell = document.getElementById("clean-shell-v1");
  const dp = shell.querySelector(".dplayer");
  const icons = dp.querySelector(".dplayer-icons-right");
  const btn = icons.querySelector(".dplayer-download-icon");
  const settingBox = dp.querySelector(".dplayer-setting");
  const settingBtn = dp.querySelector(".dplayer-setting-icon");
  const fullBtn = dp.querySelector(".dplayer-full-icon");

  const result = {
    shellBuilt: !!shell,
    btnInIconsDirect: btn && btn.parentElement === icons,
    btnLeftOfSettingBox: btn && btn.nextElementSibling === settingBox,
    settingBoxIntact: settingBox.children.length === 1 && settingBox.firstChild === settingBtn,
    fullBtnStillThere: !!fullBtn && fullBtn.parentElement.className === "dplayer-full",
    btnBeforeSettingVisually: btn && settingBtn && btn.compareDocumentPosition(settingBtn) & 4,
  };

  // 取消状态机：点击两次
  btn.click(); // 开始下载（fetch 挂起）
  const state1 = btn.__dlState;
  btn.click(); // 取消
  const state2 = btn.__dlState;
  setTimeout(() => {
    result.stateAfterStart = state1;
    result.stateAfterCancel = state2;
    result.cancelText = btn.textContent.trim();
    result.finalIcon = btn.querySelector("svg") ? "icon" : "text";
    console.log(JSON.stringify(result, null, 2));
    const pass =
      result.shellBuilt && result.btnInIconsDirect && result.btnLeftOfSettingBox &&
      result.settingBoxIntact && result.fullBtnStillThere && result.btnBeforeSettingVisually &&
      result.stateAfterStart === 1 && result.stateAfterCancel === 0 &&
      (result.cancelText === "已取消" || result.cancelText === "取消中") &&
      result.finalIcon === "icon";
    console.log("ALL_PASS:", pass);
    process.exit(0);
  }, 300);
}, 3700);
