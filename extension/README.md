# Version Saver Chrome 扩展

监听当前页面内容变化，将 `document.body.innerText` 以 `window.location.href` 为名称 POST 到 Version Saver 后端，自动保存为新版本。

## 功能

- **name**：使用 `window.location.href` 作为版本名称
- **content**：使用 `document.body.innerText` 作为内容
- **监听**：对 `document.body` 使用 MutationObserver（childList、subtree、characterData、部分 attributes）
- **防抖**：内容变化后延迟 2 秒再发送，避免频繁请求
- **去重**：若本次内容与上次发送的完全一致则不发送

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本项目的 `extension` 目录

## 配置

1. 点击扩展图标，在弹窗中点击「打开设置」
2. 在「后端 API 地址」中填写 Version Saver 的 API 基础 URL，例如：
   - 本地开发：`http://localhost:8080/api/v1`
   - 生产：`https://your-domain.com/api/v1`
3. 点击「保存」

## 使用

安装并配置后，在任意网页中：

- 扩展会自动监听页面 DOM 变化
- 当 `document.body.innerText` 发生变化且稳定约 2 秒后，会向配置的 API 发送 `POST /save`，请求体为 `{ "name": window.location.href, "content": document.body.innerText }`
- 右下角会短暂显示「已保存到 Version Saver」或错误提示

## 文件说明

- `manifest.json` - Chrome 扩展配置（Manifest V3）
- `content.js` - 注入页面的脚本：MutationObserver + 防抖 + POST
- `options.html` / `options.js` - 设置页，配置 API 地址
- `popup.html` / `popup.js` - 扩展图标点击后的弹窗

## 注意事项

- 后端需开启 CORS，允许扩展所在页面的 origin 或使用 `*`
- 若页面是 SPA，URL 变化（pushState/replaceState）时会重置“上次已发送内容”，新 URL 下的首次变化会再次触发保存
