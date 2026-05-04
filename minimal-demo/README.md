# minimal-demo

双线程架构最小可运行 demo —— 用来配合博客"一个基本事实：小程序是双线程的"那一章节阅读，一眼看穿核心模型。

核心对照关系：

| 真机 | 这里的模拟 |
| ---- | ---- |
| 渲染线程（WebView） | `iframe.html`（一个独立 iframe，有 DOM）|
| 逻辑线程（JSCore/V8） | `core.js`（跑在 Web Worker 里，没有 DOM） |
| Native 中转（WeixinJSBridge） | `native.html` 里两端挂的 `JSBridge` 对象 |

通信链路：

```
[iframe] button click
  ↓ window.JSBridge.onReceiveWebviewMessage('updateData')
[native.html] 主线程
  ↓ jscore.postMessage('updateData')
[core.js] Worker（没有 document/window）
  ↓ page.updateData() → global.postMessage(newText)
[native.html] 主线程
  ↓ webview.contentWindow.JSBridge.onReceiveNativeMessage(newText)
[iframe] p.innerHTML = newText
```

## 怎么跑

由于浏览器不允许直接以 `file://` 协议打开 iframe + Worker，需要起一个静态服务：

```bash
# 在项目根目录
npx http-server ./minimal-demo -p 8230 -c-1
# 然后浏览器打开
open http://127.0.0.1:8230/native.html
```

点"更新文案"按钮，能看到 `p` 标签内容每次追加 `!!!`。打开 DevTools 你能同时看到：

- 主线程 Console：`native接收到消息: ...`
- iframe Console：`webview收到消息: ...`
- Worker Console：`jscore收到消息: updateData`

## 为什么这个 demo 有意义

这是博客里"双线程不是为了性能，而是为了把开发者能碰的东西框住"的最小实证：

- `core.js` 里你可以试着写 `document`、`window`、`location`，会直接报错 —— **逻辑层天然没有 DOM API**
- `iframe.html` 里你写 `document.querySelector` 可以正常用，但**拿不到 Worker 的内存**，拿不到业务数据
- 它们之间唯一的通路就是 `postMessage` / `onmessage`，每条消息都要被序列化、经过主线程转发

这就是整套小程序架构安全性的根本出发点。如果想要看"基础库 + 编译器 + Exparser + 多 WebView"的完整模拟版本，请看根目录的其他四个包。
