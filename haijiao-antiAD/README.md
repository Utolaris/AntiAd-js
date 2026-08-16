# 海角网广告清理（油猴脚本）v1.1.0

## 文件说明
| 文件 | 用途 |
|---|---|
| `haijiao-adblock.user.js` | 油猴脚本（Tampermonkey / Violentmonkey 直接安装或粘贴） |
| `verify_haijiao.py` | Playwright 验证脚本（广告清理：弹窗/嵌入式/伪装广告 + 视频前贴片） |
| `verify_watermark.py` | Playwright 验证脚本（图片水印去除，有头模式） |
| `验证截图/` | 各页面验证截图 |

## 安装
1. 浏览器安装 Tampermonkey（Chrome/Edge 扩展商店；安卓用 Kiwi/狐猴等支持扩展的浏览器）
2. Tampermonkey 面板 → 新建脚本 → 全选删除 → 粘贴 `haijiao-adblock.user.js` 内容 → 保存
3. 打开海角网任意页面即可生效

`@match` 已覆盖：`board.nlqpnuezk.cc`、`*.nlqpnuezk.cc`、`hjw01.com`、`www.hjw01.com`、`*.hjw01.com`、`hjw2026.com`、`hjwang26.com`。
换镜像站时在脚本头部加一行 `// @match https://新域名/*`。

## 功能
1. **弹窗广告**：首页弹窗图片广告（每日 2 次）、右下角悬浮轮播广告、AI 科技弹窗（window.open 拦截）
2. **嵌入式广告**：横幅广告、底部广告、顶部通栏"广告"条、伪装成内容列表的 feed 广告
3. **详情页纯净模式**：仅保留 标题 + 元信息 + 正文（图片/视频），移除按钮广告、推广公告块、推荐、评论、点赞区
4. **视频前贴片广告**：清洗播放器 data-config（删除 video_player_ads），播放直接出画面
5. **图片水印去除**：服务端烧入的白色圆标"海角网"+域名水印（右下角为主，左上角也可能出现）
   - 原理：canvas 检测"贴角白色连通域" → 从外侧取镜像内容填充 + 接缝羽化
   - 检测阈值：贴角 3% 容差、白占比 8%~85%（避免误伤白色背景照片）
   - 纯前端处理，处理后以新 blob URL 替换原图
6. **速度**：document-start 注入，注入期间页面保持纯色背景，DOMContentLoaded 后一次 reveal，无"先渲染后注入"的闪烁

## 自测（本机）
```bash
cd ~/Desktop/海角网广告清理
python3 verify_haijiao.py      # 广告清理验证（有头，会弹浏览器窗口）
python3 verify_watermark.py    # 水印去除验证（有头）
```
注意：站点有风控，短时间多次自动化访问会被限流（页面加载超时），两次验证之间间隔几分钟。

## 已知事项
- 站点对高频自动化访问有限流，验证脚本失败多为风控而非脚本问题
- 水印去除对纯白背景照片有保护阈值，若某张图的水印没被识别，截图反馈即可调参
- 视频画面内若烧入了水印（在视频流里），前端无法去除，只能处理图片
