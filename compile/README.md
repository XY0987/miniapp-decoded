# compile

小程序的"编译器"。把开发者写的 `wxml/wxss/js/json` 四件套编译成运行时可以直接加载的四件套：

| 源文件 | 产物 | 作用 |
|---|---|---|
| `app.json` / `pages/**/*.json` | `dist/config.json` | Native 启动时读取，确定入口页、导航栏颜色等 |
| `pages/**/*.wxml` | `dist/view.js` | 渲染层（iframe）里执行，生成 Vue 的 `render` 函数 |
| `pages/**/*.wxss` + `app.wxss` | `dist/style.css` | 渲染层加载的样式表（加了 `data-v-xxx` scope + `rpx→rem`） |
| `app.js` / `pages/**/*.js` | `dist/logic.js` | 逻辑层（Worker）里通过 `importScripts` 加载 |

## 对应博客里的哪一段？

对应博客第 2、3 节 —— "WXML：一套看起来像 HTML 其实不是的标记语言" 和 "WXSS：不是 CSS，是带后处理的 CSS"。

具体对应关系：

- **WXML 编译**：`src/compile/wxml/toVueTemplate.js` 把 `<view>` 重写为 `<ui-view>`，然后走 Vue template compiler 生成 `render` 函数。博客里说"视图模板不会在运行时重新解析 WXML，而是复用编译后的模板逻辑"就是这一步。
- **WXSS 编译**：`src/compile/wxss/index.js` 做两件事：`rpx` 替换为 `rem`（博客里的 rpx 原理），以及给每条选择器追加 `[data-v-xxx]` 实现 Page 级作用域隔离。
- **JS 编译**：`src/compile/js/` 用 babel 把 `Page({...})` 调用加一个 `path` 参数（和 WXML 的 `scopeId` 对齐），再把所有文件包成 AMD 风格的 `modDefine(...)`。这样运行时就能按需 `require`。

## 怎么用

从一个标准小程序源码目录里运行：

```bash
cd your-mini-app/
node /path/to/compile/bin/index.js build
# 或者在 workspace 里：
pnpm compile:demo
```

源目录需要有：

```
your-mini-app/
├── app.json
├── app.js
├── app.wxss        # 可选，但目前会读
├── project.config.json
└── pages/home/
    ├── index.js
    ├── index.json
    ├── index.wxml
    └── index.wxss
```

产物会写到 `./dist/`。

## 当前支持范围（教学级）

- WXML 组件：只支持 `<view>`（通过白名单控制，见 `src/compile/wxml/tag.js`）
- 事件绑定：只支持 `bindtap`
- WXSS：支持 `rpx` 换算、scope 注入、autoprefixer
- JS：支持 `require`（会递归编译）、`Page({...})`、`App({...})`
- **不**支持：`wx:for`、`wx:if`、Mustache 插值表达式中的复杂逻辑、WXS、自定义组件、behaviors

想扩展？最容易下手的点是 `src/compile/wxml/tag.js` 里的 `tagWhiteList`。
