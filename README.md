# miniapp-decoded

> 用 Web 技术栈还原微信小程序的双线程架构：**Web Worker 当 JSCore，iframe 当 WebView，一个主页面当 Native**。
>
> 配套博客：[《微信小程序底层原理深解：从双线程架构到 Skyline 渲染引擎》](https://xy0987.github.io/posts/02-%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86-%E4%BB%8E%E5%8F%8C%E7%BA%BF%E7%A8%8B%E5%88%B0Skyline/)

## 一分钟跑起来

```bash
# 需要 Node >= 16，pnpm >= 8（如未安装：npm i -g pnpm）
pnpm install
pnpm start
```

`pnpm start` 会自动：

1. 如果检测到各包还没构建产物，逐个跑 `pnpm --filter <pkg> run build`
2. 并行起 4 个静态服务（native / ui / logic / components）
3. 等端口就绪后自动打开浏览器 `http://127.0.0.1:3077/native/index.html`

你看到的效果是一个模拟 iPhone 外壳，点击"微信"图标 → 小程序列表 → 点"抖音" → 进入一个用 `<view>{{text}}</view>` 写的假小程序。点击文字会触发 `setData`，文本末尾会追加 `!`。

想看实时热更新源码？另开一个终端：

```bash
pnpm dev    # 4 个包的 webpack --watch 并行跑
```

## 这个项目在讲什么

小程序的双线程架构官方文档只有结论，没有白盒实现。这个项目用浏览器里现成的能力把整个架构"实装"一遍，**让你能单步调试每一个跨线程消息**：

| 博客里的概念              | 真机实现                                           | 这里的对应                                                               |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| 渲染线程（WebView）       | iOS WKWebView / Android XWeb                       | `<iframe>` + `ui/` SDK                                                   |
| 逻辑线程（JSCore/V8）     | 独立 JS 引擎，无 DOM                               | `Web Worker` + `logic/` SDK                                              |
| Native 中转               | 微信客户端                                         | `native/` 这个 Web 应用                                                  |
| WeixinJSBridge            | iOS messageHandlers / Android @JavascriptInterface | `window.JSBridge` 对象 + `mitt` 事件总线                                 |
| 小程序编译产物            | `WAService.js` / `WAWebview.js` / `app-service.js` | `compile/` 包输出的 `logic.js` / `view.js` / `style.css` / `config.json` |
| Exparser（仿 Shadow DOM） | 微信基础库自研组件系统                             | Vue 2 + 自定义 `<ui-view>` 组件（教学简化版）                            |
| PageFrame                 | 预热页面容器                                       | `native/pageframe/index.html` 预加载 Vue + ui SDK + components           |
| `App()` / `Page()` 全局   | JSCore 全局注入                                    | `logic/src/globalApi/index.js` 挂到 `global` 上                          |
| `setData` 跨线程          | WeixinJSBridge.publish                             | `message.send({type:'updateModule'})`                                    |

## 仓库结构

```
miniapp-decoded/
├── native/          # 原生容器：Device → Application → MiniAppSandbox → Bridge → WebView + JSCore
├── logic/           # 逻辑层 SDK：编译后会作为 Worker 脚本被 native 下发
├── ui/              # 渲染层 SDK：编译后被 pageframe.html 引入
├── components/      # 基础组件库（<ui-view> 等）：模拟 Exparser
├── compile/         # 编译器：wxml/wxss/js → view.js/style.css/logic.js
├── minimal-demo/    # 最小 demo：只保留 Worker+iframe+postMessage 的骨架
├── scripts/         # 一键启动、vendor 拷贝、compile demo 脚手架
├── pnpm-workspace.yaml
└── package.json
```

## 端口布局

| 服务         | 端口 | 作用                                                        |
| ------------ | ---- | ----------------------------------------------------------- |
| `native`     | 3077 | 入口页面、pageframe、小程序资源（`/mini_resource/:appId/`） |
| `logic_sdk`  | 3100 | 逻辑层基础 SDK（给 Worker fetch 用）                        |
| `ui_sdk`     | 3200 | 渲染层基础 SDK（给 iframe 用 `<script>` 引入）              |
| `components` | 3600 | Vue.js 运行时 + `<ui-view>` 组件                            |

跨端口通信都走 `window.postMessage`（主线程↔iframe）和 `worker.postMessage`（主线程↔Worker）。

## 一次完整点击链路

博客里画的那张"点击 → setData → 渲染"时序图，在这里你可以实打实地打点看：

```
[iframe]             [native 主线程]         [Worker]
 click                     │                    │
  │ window.JSBridge        │                    │
  │ .onReceiveUIMessage────►                    │
  │   type: trrigerEvent   │                    │
  │                        ├─ jscore.postMessage┤
  │                        │                    │ runtimeManager.trrigerEvent
  │                        │                    │   → page.viewTap()
  │                        │                    │   → this.setData({...})
  │                        │◄─ Worker.postMessage│
  │                        │   type: updateModule│
  │                        ├─ webview.postMessage│
  │ onReceiveNativeMessage ◄                    │
  │   Vue.set(viewModule, key, data[key])       │
  │   → 渲染层重渲染                              │
```

运行图：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              native (模拟微信客户端)                              │
│                                                                                  │
│   职责：管理小程序生命周期、视图栈、Bridge 消息转发                                  │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                        Bridge (通信桥)                                  │    │
│   │                                                                         │    │
│   │   职责：连接 JSCore ↔ WebView，双向消息转发                              │    │
│   └──────────────────────────┬─────────────────────────┬────────────────────┘    │
│                              │                         │                         │
│              ┌───────────────┴───────────────┐         │                         │
│              ▼                               ▼         ▼                         │
│   ┌─────────────────────────────┐  ┌──────────────────────────────────────┐     │
│   │  JSCore (Worker 线程)       │  │  WebView (iframe)                     │     │
│   │                             │  │                                       │     │
│   │  运行 logic 包              │  │  运行 ui 包 + components 包           │     │
│   │  - App()/Page() API        │  │  - Vue 框架                           │     │
│   │  - 生命周期管理             │  │  - 页面渲染                            │     │
│   │  - setData 发送             │  │  - setData 接收 (Vue.set)             │     │
│   │  - 事件回调执行             │  │  - 事件捕获上报                        │     │
│   │                             │  │                                       │     │
│   │  + 用户代码 (logic.js)      │  │  + 用户代码 (view.js + style.css)     │     │
│   └─────────────────────────────┘  └──────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                                      ▲
                                      │ 编译产物
                                      │
┌─────────────────────────────────────┴────────────────────────────────────────────┐
│                              compile (编译器)                                     │
│                                                                                   │
│   输入：wxml / wxss / js / json (开发者源码)                                       │
│   输出：view.js / style.css / logic.js / config.json                              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## 命令清单

| 命令                | 作用                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm install`      | 安装依赖（pnpm workspace 会自动去重 webpack/babel 等重复依赖）                                         |
| `pnpm start`        | **推荐**：自动 build + serve + 打开浏览器                                                              |
| `pnpm build`        | 只编译所有子包                                                                                         |
| `pnpm dev`          | 监听所有子包源码，webpack watch 模式                                                                   |
| `pnpm serve`        | 只启服务（不 build）                                                                                   |
| `pnpm compile:demo` | 演示"编译器"：把 `native/apps/douyin-src/` 的 wxml/wxss/js 编译成 `native/apps/douyin/` 里的运行时产物 |
| `pnpm clean`        | 清理所有产物目录                                                                                       |
| `pnpm clean:all`    | 连 `node_modules` 一起清                                                                               |

## 源码阅读指南

> 这个项目有 5 个包，初次看容易迷路。本节帮你理清**包之间的关系**、**构建如何串联**、以及**推荐的阅读顺序**。

### 各包的角色与关系

```
                          ┌────────────────────────────────┐
                          │       compile（编译器）          │
                          │                                │
                          │  wxml/wxss/js/json → 运行时产物 │
                          └────────────────┬───────────────┘
                                           │ 编译产物存放于
                                           ▼ native/apps/douyin/
┌──────────────────────────────────────────────────────────────────────────────┐
│                        native（原生容器 - 端口 3077）                          │
│                                                                              │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ 静态服务路由：                                                          ┃  │
│  ┃   /native        → native/public/     (入口页面)                        ┃  │
│  ┃   /page_frame    → native/pageframe/  (iframe 模板)                     ┃  │
│  ┃   /mini_resource → native/apps/       (小程序编译产物)                   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                              │
│         ┌──── fetch ──────────────┐   ┌──── iframe src ───────────────┐     │
│         ▼                         │   ▼                               │     │
│  ┌─────────────────┐              │  ┌───────────────────────────────┐│     │
│  │  Worker (JSCore) │              │  │  iframe (WebView)             ││     │
│  │                  │              │  │                               ││     │
│  │  ┌────────────┐ │              │  │  pageframe/index.html 加载:   ││     │
│  │  │ logic SDK  │ │◄── port:3100 │  │  ├── vue.js     ← port:3600  ││     │
│  │  │ (core.js)  │ │              │  │  ├── components ← port:3600  ││     │
│  │  ├────────────┤ │              │  │  └── ui SDK     ← port:3200  ││     │
│  │  │ 用户代码   │ │◄── port:3077 │  │                               ││     │
│  │  │ (logic.js) │ │  /mini_res.  │  │  运行时再加载:                 ││     │
│  │  └────────────┘ │              │  │  ├── view.js    ← port:3077  ││     │
│  └─────────────────┘              │  │  └── style.css  ← port:3077  ││     │
│                                   │  │       (/mini_resource/...)     ││     │
│                                   │  └───────────────────────────────┘│     │
│                                   │                                    │     │
└───────────────────────────────────┴────────────────────────────────────┘     │
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
│
│  各包构建产物 & 服务：
│
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │ logic（逻辑层 SDK - 端口 3100）                                          │
│  │   构建: src/index.js → public/core.js                                   │
│  │   服务: GET /logic/core.js                                              │
│  │   作用: 提供 App()/Page() 全局API + 消息处理 + 生命周期管理              │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │ ui（渲染层 SDK - 端口 3200）                                             │
│  │   构建: src/index.js → public/core.js                                   │
│  │   服务: GET /ui_sdk/core.js                                             │
│  │   作用: 提供 JSBridge + 消息处理 + Vue 实例创建 + setData 接收           │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │ components（组件库 - 端口 3600）                                          │
│  │   构建: src/index.js → public/js/index.js + public/css/index.css        │
│  │   服务: GET /components/* + GET /lib/vue.js                             │
│  │   作用: 注册 <ui-view> 等 Vue 组件 + 提供 Vue 运行时                    │
│  └─────────────────────────────────────────────────────────────────────────┘
```

### 构建顺序与依赖链

执行 `pnpm build` 时，各包按以下顺序构建（也是它们的依赖关系）：

```
① prepare-vendor    从 node_modules 拷贝 vue.js → components/lib/vue.js
        │
        ▼
② build:components  components/src → components/public/
        │            (渲染层 iframe 需要先加载组件库)
        ▼
③ build:ui          ui/src → ui/public/core.js
        │            (渲染层 iframe 需要加载 ui SDK)
        ▼
④ build:logic       logic/src → logic/public/core.js
        │            (Worker 需要加载 logic SDK)
        ▼
⑤ build:native      native/src → native/public/
                     (入口页面，需等其他服务都能提供产物)
```

**注意**：各包在**编译时**没有互相 import（它们是独立的 webpack 构建），但在**运行时**通过 HTTP 请求互相加载对方的产物。这是理解项目的关键！

### 运行时加载顺序（一次小程序启动的完整链路）

```
时间线 ──────────────────────────────────────────────────────────────────────────►

1. 浏览器打开 http://127.0.0.1:3077/native/index.html
   └── 加载 native/public/js/index.js（native 主逻辑）

2. native 初始化
   └── Device → Application → 展示 Home 页 → 用户点击小程序图标

3. 创建 MiniAppSandbox
   ├── 创建 Bridge（通信桥梁）
   │
   ├── 创建 JSCore（Worker）─── 逻辑线程，无 DOM，只跑 JS
   │   └── fetch("http://127.0.0.1:3100/logic/core.js") → Blob → new Worker()
   │
   │       ┌─────────────────────────────────────────────────────────────┐
   │       │ ① 平台侧 SDK（logic/core.js - 类似真机的 WAService.js）    │
   │       │    ├── globalApi.init()                                     │
   │       │    │   └── 注入 global.App() / global.Page() 全局 API      │
   │       │    ├── messageManager.init()                                │
   │       │    │   └── 监听消息，路由到对应处理函数                      │
   │       │    └── runtimeManager                                       │
   │       │        └── 管理 App/Page 实例、生命周期调度、setData 发送    │
   │       │                                                             │
   │       │ ② 用户代码（稍后通过 importScripts 加载 logic.js）          │
   │       │    └── 用户编写的 App({...}) / Page({data, onLoad, ...})    │
   │       │        调用 SDK 注入的全局 API，注册到 runtimeManager       │
   │       └─────────────────────────────────────────────────────────────┘
   │
   └── 创建 WebView（iframe）─── 渲染线程，有 DOM，负责 UI 展示
       └── src = "http://127.0.0.1:3077/page_frame/"

           ┌─────────────────────────────────────────────────────────────┐
           │ ① 平台侧 SDK（pageframe/index.html 预加载）                │
           │    ├── vue.js (← port:3600)                                │
           │    │   └── 渲染引擎（真机是 Exparser，这里用 Vue 模拟）     │
           │    ├── components/js/index.js (← port:3600)                │
           │    │   └── 基础组件注册（<ui-view> 等 + 事件代理）          │
           │    ├── components/css/index.css (← port:3600)              │
           │    │   └── 基础组件样式                                     │
           │    └── ui_sdk/core.js (← port:3200)                        │
           │        ├── globalApi.init() → 注入 window.Page()           │
           │        ├── messageManager.init() → 监听 JSBridge 消息      │
           │        └── runtimeManager → Vue 实例管理 + setData 接收    │
           │                                                             │
           │ ② 用户代码（稍后通过动态 <script>/<link> 加载）             │
           │    ├── view.js  → 用户编写的页面模板（编译成 render 函数）  │
           │    └── style.css → 用户编写的页面样式（rpx→rem 编译后）     │
           └─────────────────────────────────────────────────────────────┘

4. Bridge.start()（三端就绪，开始协作）
   │
   ├──► 向 JSCore 发送 "loadResource"
   │    └── Worker 执行 importScripts("/mini_resource/douyin/logic.js")
   │        └── 用户代码里的 App({...}) / Page({...}) 被调用
   │            → 通过 SDK 注入的全局 API 注册到 runtimeManager
   │
   ├──► 向 WebView 发送 "loadResource"
   │    ├── 动态创建 <script src="/mini_resource/douyin/view.js">
   │    │   └── 用户的页面模板（render 函数）注册到渲染层 runtimeManager
   │    └── 动态创建 <link href="/mini_resource/douyin/style.css">
   │        └── 用户样式注入页面
   │
   └── 资源就绪 → createApp → createPage → onLoad → setData → 首屏渲染
```

**总结**：每个线程都是「平台 SDK 先行 + 用户代码后载」的两段式加载。SDK 提供基础能力（API 注入、消息通信、生命周期管理），用户代码调用这些能力来注册自己的业务逻辑。两者缺一不可——SDK 是骨架，用户代码是血肉。

### 推荐阅读顺序

根据上面的架构理解，建议按以下顺序阅读源码：

#### 第一步：从最简骨架理解核心原理（30 分钟）

| 序号 | 文件            | 看什么                                                      |
| ---- | --------------- | ----------------------------------------------------------- |
| 1    | `minimal-demo/` | 抛开所有 SDK，只有 Worker + iframe + postMessage 的最小实现 |

#### 第二步：理解 Native 如何把两端串起来（1 小时）

| 序号 | 文件                                               | 看什么                                                |
| ---- | -------------------------------------------------- | ----------------------------------------------------- |
| 2    | `native/app.js`                                    | 静态服务路由配置，理解各端口的资源从哪来              |
| 3    | `native/pageframe/index.html`                      | iframe 的 HTML 模板，看它加载了哪些外部脚本           |
| 4    | `native/src/index.js`                              | Native 入口，初始化流程                               |
| 5    | `native/src/core/jscore/index.js`                  | 如何用 Worker 模拟 JSCore                             |
| 6    | `native/src/core/webview/webview.js`               | 如何用 iframe 模拟 WebView                            |
| 7    | `native/src/core/bridge/index.js`                  | **重点！** 消息如何在 Worker ↔ Native ↔ iframe 间流转 |
| 8    | `native/src/core/miniAppSandbox/miniAppSandbox.js` | Bridge + JSCore + WebView 如何组装                    |

#### 第三步：理解逻辑层 SDK 内部（40 分钟）

| 序号 | 文件                                | 看什么                                      |
| ---- | ----------------------------------- | ------------------------------------------- |
| 9    | `logic/src/index.js`                | SDK 入口，就两行：注入 API + 启动消息监听   |
| 10   | `logic/src/globalApi/index.js`      | `global.App()` / `global.Page()` 是怎么来的 |
| 11   | `logic/src/message/index.js`        | Worker 中 `global.postMessage` 的封装       |
| 12   | `logic/src/messageManager/index.js` | 消息路由：收到什么类型做什么事              |
| 13   | `logic/src/loader/index.js`         | `importScripts(logic.js)` 在这里发生        |
| 14   | `logic/src/runtimeManager/Page.js`  | **重点！** setData 的实现                   |

#### 第四步：理解渲染层 SDK 内部（40 分钟）

| 序号 | 文件                             | 看什么                                                   |
| ---- | -------------------------------- | -------------------------------------------------------- |
| 15   | `ui/src/index.js`                | 入口，和 logic 的结构一一对应                            |
| 16   | `ui/src/message/index.js`        | iframe 中通过 `window.JSBridge` 接收消息                 |
| 17   | `ui/src/messageManager/index.js` | 消息路由                                                 |
| 18   | `ui/src/loader/index.js`         | 动态创建 `<script>` / `<link>` 加载 view.js 和 style.css |
| 19   | `ui/src/runtimeManager/index.js` | **重点！** `Vue.set()` 更新数据，触发重渲染              |

#### 第五步：理解组件如何工作（20 分钟）

| 序号 | 文件                            | 看什么                                     |
| ---- | ------------------------------- | ------------------------------------------ |
| 20   | `components/src/index.js`       | 组件注册入口                               |
| 21   | `components/src/view/index.js`  | `<ui-view>` 组件定义                       |
| 22   | `components/src/proxy/index.js` | **重点！** bindtap 事件如何冒泡到 JSBridge |

#### 第六步：理解编译器如何把源码变成产物（30 分钟）

| 序号 | 文件                                | 看什么                                                    |
| ---- | ----------------------------------- | --------------------------------------------------------- |
| 23   | `compile/src/commanders/build.js`   | 编译总流程                                                |
| 24   | `compile/src/compile/js/index.js`   | JS 编译：包装成 `modDefine` AMD 模块                      |
| 25   | `compile/src/compile/wxml/index.js` | WXML 编译：标签转换 → Vue template compiler → render 函数 |
| 26   | `compile/src/compile/wxss/index.js` | WXSS 编译：rpx→rem + scoped 样式                          |

### 各包源码结构对照

logic 和 ui 这两个 SDK 的内部结构是**镜像对称**的，这不是巧合——它们分别是双线程架构的两侧：

```
logic/src/                          ui/src/
├── index.js         (入口)         ├── index.js         (入口)
├── globalApi/       (注入 API)     ├── globalApi/       (注入 API)
│   └── index.js     App()/Page()   │   └── index.js     Page()
├── message/         (通信底层)     ├── message/         (通信底层)
│   └── index.js     postMessage    │   └── index.js     JSBridge
├── messageManager/  (消息路由)     ├── messageManager/  (消息路由)
│   └── index.js     分发消息       │   └── index.js     分发消息
├── loader/          (资源加载)     ├── loader/          (资源加载)
│   └── index.js     importScripts  │   └── index.js     <script>/<link>
└── runtimeManager/  (运行时)       └── runtimeManager/  (运行时)
    ├── index.js     管理实例           └── index.js     Vue 实例管理
    ├── App.js       App 类
    └── Page.js      Page 类(setData)
```

### 关键设计理解

**Q: 为什么各包之间没有 import，却能协作？**

A: 这正是小程序双线程架构的核心设计！各端的代码运行在**完全隔离的 JS 上下文**中：

- `logic SDK` → Worker（无 DOM，无 window）
- `ui SDK` → iframe（独立窗口上下文）
- `native` → 主页面

它们之间**唯一的联系**就是 `postMessage`。这种设计也体现在构建上：每个包独立 webpack 打包，不互相 import，运行时通过 HTTP 加载对方产物 + 消息通信协作。

**Q: `compile` 包生成的产物如何被其他包消费？**

A: `compile` 的产物（logic.js / view.js / style.css / config.json）存放在 `native/apps/<appId>/` 目录下，由 native 的静态服务通过 `/mini_resource/<appId>/` 路由对外提供。Worker 通过 `importScripts()` 加载 logic.js，iframe 通过 `<script>`/`<link>` 加载 view.js 和 style.css。

## 想深入学什么？

- 点击如何跨两个线程 → 看 `native/src/core/bridge/index.js`
- Worker 怎么假装自己是 JSCore → 看 `native/src/core/jscore/index.js`
- `Page({ data, onLoad, setData, ...})` 如何被变成实例 → 看 `logic/src/runtimeManager/Page.js`
- wxml 如何变成 Vue render 函数 → 看 `compile/src/compile/wxml/`
- 多页面（多 WebView）栈怎么叠的 → 看 `native/src/core/miniAppSandbox/miniAppSandbox.js` 和 `Application.presentView`

想看最小 demo（抛开所有 SDK/编译器）：见 [minimal-demo/README.md](./minimal-demo/README.md)。

## H5 模拟的省略与权衡

本项目复现的是**架构层面的消息流**，不是**运行时层面的性能/隔离特征**。以下这些点是真机有、但 H5 没法等价（或刻意省略）的部分，每一条都附上"为什么省"。

### 1. 渲染层用 Vue 替代 Exparser

- **真机**：微信自研的 Exparser —— 仿 Shadow DOM 的组件系统，自定义元素、自实现生命周期、自实现虚拟 DOM Diff。
- **这里**：Vue 2 + 自定义 `<ui-view>`，直接让 `compile/` 把 wxml 编成 Vue 的 `render` 函数。
- **为什么省**：Exparser 是十万行级别的自研基础库，复现成本极高；而本项目的教学目标是"讲清楚双线程消息流"，不是"重写一个组件系统"。Vue 刚好提供了"模板编译 + 响应式更新 + 自定义组件"这三件套，几行胶水代码就能把编译产物跑起来，把精力留给 bridge/jscore/webview 这些真正的主角。
- **代价**：看到的"wxml → render 函数 AST"是 Vue 的产物，不是小程序真机产物；`<scroll-view>`/`<swiper>`/`Component()` 等组件系统能力全部缺失。

### 2. `setData` 没有做 data diff / patch

- **真机**：逻辑层持有一份 data 副本，`setData` 后做 **diff**，只把变化字段序列化发给渲染层；渲染层拿到 patch 再走 Exparser 的虚拟 DOM 更新。
- **这里**：每次 `setData` 把整份 `this.data` 直接 `postMessage` 过去，渲染层 `Vue.set(viewModule, key, data[key])` 粗暴覆盖（见 `logic/src/runtimeManager/Page.js` 与 `ui/src/runtimeManager/index.js`）。
- **为什么省**：diff 算法本身要实现一遍（或引入 deep-diff 之类依赖），还要在渲染层把 patch 应用回响应式对象；对理解"为什么 setData 是异步的、为什么要跨线程"没有增量收益，反而模糊焦点。
- **代价**：复现不了"大 `setData` 导致卡顿"这种真机经典性能问题，也看不到 data diff 带来的优化效果。

### 3. 跨线程通信没有真实序列化开销

- **真机**：JSCore ↔ WebView 消息要走 **JSON 序列化 + Native Bridge**，这是性能瓶颈的主要来源。
- **这里**：
  - `worker.postMessage` 走浏览器的 structured clone，有序列化但比真机便宜得多；
  - `iframe` 方向甚至根本**没用 `postMessage`**，直接 `window.frames[name].JSBridge.onReceiveNativeMessage(msg)` 跨 iframe 调函数（见 `native/src/core/webview/webview.js`），相当于同进程直接函数调用，**连一次 clone 都省了**。
- **为什么省**：同源 iframe 下 `window.frames[name]` 就能拿到子窗口的 JS 上下文，直接调函数写起来最直观；真要走 `postMessage` 得再套一层异步和监听，对演示消息流向没帮助。
- **代价**：测不出"跨线程通信开销"的真实体感，因此也无法用这个 demo 论证"为什么不要频繁 setData 小数据"。

### 4. 没有进程隔离

- **真机**：WebView 进程和 JSCore 进程**不是同一个进程**，一边崩溃不会拖死另一边。
- **这里**：iframe 和 Worker 都是主页面的子资源，同属一个浏览器进程；主页面还能通过 `window.frames[name]` 直接访问 iframe 的 JS 上下文。
- **为什么省**：**浏览器平台原生不提供进程级隔离能力**。Web Worker 连独立线程都是"尽力而为"，iframe 的 Site Isolation 也由浏览器决定，开发者无法强制。这不是偷懒，是平台限制。
- **代价**：这个 demo 不能复现"某个页面脚本死循环不会卡住小程序导航栏"这类真机特性。

### 5. `wx.*` 原生 API 全部未实现

- **真机**：`wx.login`、`wx.request`、`wx.getUserInfo`、`wx.scanCode`…… 由微信客户端用原生能力实现，通过 WeixinJSBridge 暴露给逻辑层。
- **这里**：只实现了"注册 App/Page/消息桥接"，没有任何 `wx.xxx`。
- **为什么省**：这些 API 的本质是"宿主客户端能力封装"，每一个都需要一套独立的 mock（网络、摄像头、扫码、登录态…）。项目目标是讲**双线程架构**，不是讲**宿主 API 封装**——这是两个独立话题，混在一起反而讲不清楚。
- **代价**：跑不了任何依赖 `wx.*` 的真实业务代码，只能跑纯 `setData` 的 demo。

### 6. 组件和指令覆盖度极低

- **这里只支持**：`<view>`、`bindtap`、`setData` 驱动的文本更新。
- **不支持**：`<scroll-view>` / `<swiper>` / `<picker>` / `<input>`、`wx:for` / `wx:if` 等复杂指令、`Component()` 自定义组件、`behaviors`、插槽、样式隔离等。
- **为什么省**：每加一个组件/指令都要同时改 `compile/`（wxml 编译规则）、`components/`（运行时组件）、`ui/`（渲染层 runtime），工作量是乘法关系；而骨架走通后，加组件只是"再照葫芦画瓢一遍"，边际收益递减。
- **代价**：只能作为原理 demo，不能当小程序引擎用。

### 7. Skyline 渲染模式完全不模拟

- **真机**：Skyline 是微信后来推出的"绕过 WebView 的原生渲染管线"，类似 Flutter，直接用 C++ 绘制，逻辑层仍然是 JSCore。
- **这里**：没有任何 Skyline 相关实现。
- **为什么省**：Skyline 的核心是"用自研原生渲染替代 WebView"，而 Web 平台上**不存在"非 WebView 的渲染后端"**，这是**根本性的平台能力缺失**，不是省不省的问题。
- **代价**：博客里讲 Skyline 的部分，只能停留在"原理说明"，没有对应的可运行 demo。

### 一张表总结

| 特性        | 真机                        | 本项目                   | 原因                       |
| ----------- | --------------------------- | ------------------------ | -------------------------- |
| 渲染层      | Exparser                    | Vue 2                    | 复现成本极高，偏离教学目标 |
| setData     | diff + patch                | 整份覆盖                 | 对理解消息流无增量收益     |
| 跨线程通信  | JSON 序列化 + Native Bridge | postMessage / 直接调函数 | 同源 iframe 下直接调更直观 |
| 进程隔离    | WebView / JSCore 分进程     | 同进程                   | 浏览器平台不提供该能力     |
| `wx.*` API  | 宿主客户端实现              | 未实现                   | 是独立话题，混讲反而讲不清 |
| 组件 / 指令 | 全量                        | 仅 `<view>` + `bindtap`  | 边际收益递减               |
| Skyline     | 原生渲染管线                | 不模拟                   | Web 平台无对等能力         |

> 一句话：**这个 demo 用来理解"为什么小程序是双线程、为什么 setData 异步、为什么要 PageFrame 预热"是够的；用来分析"小程序为什么快/慢"则不够——那些问题的答案藏在被省略的部分里。**

## 注意事项

- 这是**教学级实现**，不追求覆盖小程序所有特性；具体省略了哪些、为什么省，见上方[H5 模拟的省略与权衡](#h5-模拟的省略与权衡)一节。
- 渲染层用 Vue 替代真机的 Exparser，**不等于**真机就是用 Vue —— 只是用它快速模拟一个"仿 Shadow DOM + 模板渲染"的系统。

## License

MIT
