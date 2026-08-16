# 51爆料网纯净模式（油猴脚本项目）

针对 51爆料网（brown/alcohol/birth.qprvlexj.com 及 cloudfront 镜像）的逆向工程与广告清理油猴脚本。

## 目录结构

- **51baoliao-clean.user.js** — 最终交付的油猴脚本（v1.4.8，桌面根目录同时有一份副本）
- **outputs/** — 交付物（脚本 + 前后效果对比截图 before-ads.png / after-clean.png）
- **page.html** — 分析用的原始文章页快照（brown 站）
- **work/** — 工作区
  - mirrors/、mirrors-mobile/ — 三个镜像站桌面/安卓 UA 的 HTML 快照
  - home/ — 首页桌面/安卓快照
  - frames/ — 视频流抽帧（水印分析）
  - v1*.png — 各版本效果截图
  - test-*.js — jsdom 回归测试（node test-v11.js / test-mirrors.js / test-v141.js）
  - player-alcohol.js — 播放器插件源码（广告系统分析）

## 脚本功能（v1.4.8）

| 功能 | 说明 |
|---|---|
| 文章页纯净模式 | 纯背景过渡（无广告闪现），仅保留标题 + DPlayer 视频；标题字体/背景色与导航页一致 |
| 片头广告清除 | data-config 清洗（ads_skip=1 + 删除广告字段）+ dplayer-pre-img 专项清除 |
| 播放器内广告 | video_player_ads 删除 + DPLAYER_PREROLL_AD 钩子 |
| 下载按钮 | 播放器右上角悬浮圆钮，AES-128 解密合并下载（可取消、实时进度，另存为流式写盘/降级浏览器下载） |
| 移动端播放 | 恢复原生播放按钮 + 点击画面播放/暂停 |
| 首页/列表页 | 移除浮点广告(#adFloat)、列表广告卡片(article.ad-item)、弹窗等；保留分类导航/汉堡菜单 |
| 点击过渡 | 列表页点视频链接时纯色遮罩，无缝过渡到视频页 |

## 安装

1. Chrome 安装 Tampermonkey
2. 把 51baoliao-clean.user.js 拖进 Chrome → 安装
3. @match 已覆盖: *.qprvlexj.com、www.51baoliao01.com、d1epqpoay27u74.cloudfront.net

## 测试

- jsdom 回归: cd work && node test-v11.js
- 真实浏览器验证: 使用 playwright-core（headless）
- 语法检查: biome check 51baoliao-clean.user.js

## 版本历史

- v1.0.0 基础去广告（文章页重建 + 播放器广告禁用）
- v1.1.x 镜像站支持 + 全站 @match
- v1.2.0 纯背景过渡 + 导航页样式统一
- v1.3.x 下载按钮（AES-128 解密、空行解析修复、CDN 坏缓存重试）
- v1.4.0-1.4.4 下载重构（另存为流式 + 取消）、控制条常显、DPlayer 内部保护、精确广告字段匹配
- v1.4.5 悬浮下载按钮 + 图标重绘（修复控制条挤压与三角形图标）
- v1.4.6 document-start 注入健壮性（appendRoot）+ 片头广告专项清除
- v1.4.7 移动端播放按钮恢复 + 点击画面播放/暂停
- v1.4.8 修复移动分类导航误删（移除通用 position:fixed 判定）
