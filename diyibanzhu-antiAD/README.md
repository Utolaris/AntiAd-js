# 第一版主网（m.diyibanzhu.me）广告清理

## 文件
- `diyibanzhu-adblock.user.js` — 油猴脚本（Tampermonkey / Violentmonkey / Kiwi 浏览器）
- `验证截图/` — 清理后截图

## 清理内容
1. **正文下方两条漫画推广广告条**（`#ad.slide`，369x115，跳转 hanguomanhua.org）
2. **底部 30 个隐形点击劫持块**（3 行 x 10 列，opacity:0.01 透明层，点击跳转广告，由 js4.js 注入）
3. 页面顶部/底部 `.slide-ad` 空广告位占位

## 安装（安卓手机）
手机 Chrome 不支持扩展，需要：
- **方案 A（推荐）**：安装 Kiwi Browser（Play 商店）→ 装 Tampermonkey 扩展 → 导入本脚本
- **方案 B**：夸克浏览器 → 设置 → 脚本（部分版本支持油猴脚本）→ 添加本脚本
- 电脑：Chrome/Edge + Tampermonkey，新建脚本粘贴保存

## 效果
- 底部广告条与隐形点击层完全移除（DOM 删除，非仅隐藏）
- 正文/章节目录不受影响
- document-start 注入：页面显示纯色背景，清理完成后再显示，无闪烁
