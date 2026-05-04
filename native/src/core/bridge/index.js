/**
 * @file Bridge 通信桥
 * @description 小程序双线程架构的核心 —— Native 层的消息中转站
 *
 * 通信流程图：
 * ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
 * │   WebView   │ ←───→ │   Bridge    │ ←───→ │   JSCore    │
 * │  (iframe)   │       │  (Native)   │       │  (Worker)   │
 * │  渲染线程    │       │  消息中转    │       │  逻辑线程    │
 * └─────────────┘       └─────────────┘       └─────────────┘
 *
 * 典型数据流示例（用户点击触发 setData）：
 * 1. [WebView] 用户点击 → JSBridge.onReceiveUIMessage({type:'trrigerEvent'})
 * 2. [Bridge]  uiMessageHandler → trrigerEvent → jscore.postMessage
 * 3. [JSCore]  执行 page.method() → setData(newData)
 * 4. [JSCore]  postMessage({type:'updateModule', data})
 * 5. [Bridge]  jscoreMessageHandler → updateModule → webview.postMessage
 * 6. [WebView] Vue.set() 更新视图
 */
import { uuid } from '@native/utils/util';
import { WebView } from '@native/core/webview/webview';

/**
 * Bridge - 连接 WebView(渲染线程) 和 JSCore(逻辑线程) 的通信桥
 *
 * status 状态机（用于同步双线程的加载进度）：
 * - 0: 初始状态
 * - 1: UI 或 Logic 其中一个加载完成
 * - 2: UI 和 Logic 都加载完成，可以 createApp
 * - 3: App 创建完成，可以准备初始数据
 * - 4: 初始数据就绪，可以首次渲染
 */
export class Bridge {
  constructor(opts) {
    this.id = `bridge_${uuid()}`; // Bridge 唯一标识
    this.opts = opts; // 配置选项
    this.webview = null; // WebView 实例（iframe）
    this.jscore = opts.jscore; // JSCore 实例（Worker）
    this.parent = null; // 父容器（MiniAppSandbox）
    this.status = 0; // 加载状态计数器
    // 监听来自逻辑线程（JSCore/Worker）的消息
    this.jscore.addEventListener('message', this.jscoreMessageHandler.bind(this));
  }

  /**
   * 处理来自 JSCore（逻辑线程）的消息
   * @param {Object} msg - 消息对象 {type, body}
   */
  jscoreMessageHandler(msg) {
    const { type, body } = msg;

    // 过滤掉不属于当前 Bridge 的消息（多页面场景）
    if (body.bridgeId !== this.id) {
      return;
    }

    switch (type) {
      // 逻辑层资源（logic.js）加载完成
      case 'logicResuorceLoaded':
        this.status++;
        this.createApp();
        break;

      // App 实例创建完成，通知逻辑层准备页面初始数据
      case 'appIsCreated':
        this.status++;
        this.notifyMakeInitialData();
        break;

      // 逻辑层已准备好初始数据，发送给渲染层
      case 'initialDataIsReady':
        this.status++;
        this.setInitialData(msg);
        break;

      // 【核心】逻辑层 setData 后，转发数据变更给渲染层
      case 'updateModule':
        this.updateModule(body);
        break;
    }
  }

  /**
   * 处理来自 WebView（渲染线程）的消息
   * @param {Object} msg - 消息对象 {type, body}
   */
  uiMessageHandler(msg) {
    const { type } = msg;

    switch (type) {
      // 渲染层资源（view.js + style.css）加载完成
      case 'uiResourceLoaded':
        this.status++;
        this.createApp();
        break;

      // Vue 组件 created，通知逻辑层创建对应 Page 实例
      case 'moduleCreated':
        this.uiInstanceCreated(msg.body);
        break;

      // Vue 组件 mounted，触发逻辑层 onReady 生命周期
      case 'moduleMounted':
        this.uiInstanceMounted(msg.body);
        break;

      // 页面滚动事件，转发给逻辑层的 onPageScroll
      case 'pageScroll':
        this.pageScroll(msg.body);
        break;

      // 【核心】用户交互事件（如 bindtap），转发给逻辑层执行对应方法
      case 'trrigerEvent':
        this.trrigerEvent(msg.body);
        break;
    }
  }

  /**
   * 将渲染层的用户事件转发给逻辑层
   * 例如：bindtap="handleClick" → 逻辑层执行 page.handleClick()
   */
  trrigerEvent(msg) {
    const { id, methodName } = msg;

    this.jscore.postMessage({
      type: 'trrigerEvent',
      body: {
        id,
        methodName,
      },
    });
  }

  /**
   * 转发页面滚动事件到逻辑层
   */
  pageScroll(msg) {
    const { id, scrollTop } = msg;

    this.jscore.postMessage({
      type: 'pageScroll',
      body: {
        id,
        scrollTop,
      },
    });
  }

  /**
   * 渲染层 Vue 组件 mounted 后，通知逻辑层触发 onReady
   */
  uiInstanceMounted(msg) {
    const { id } = msg;

    this.jscore.postMessage({
      type: 'moduleMounted',
      body: {
        id,
      },
    });
  }

  /**
   * 通知逻辑层准备页面的初始数据（Page.data）
   */
  notifyMakeInitialData() {
    this.jscore.postMessage({
      type: 'makePageInitialData',
      body: {
        bridgeId: this.id,
        pagePath: this.opts.pagePath,
      },
    });
  }

  /**
   * 触发 App.onShow 生命周期
   */
  appShow() {
    // 确保双线程都已加载完成
    if (this.status < 2) {
      return;
    }

    this.jscore.postMessage({
      type: 'appShow',
      body: {},
    });
  }

  /**
   * 触发 Page.onShow 生命周期
   */
  pageShow() {
    if (this.status < 2) {
      return;
    }

    this.jscore.postMessage({
      type: 'pageShow',
      body: {
        bridgeId: this.id,
      },
    });
  }

  /**
   * 触发 App.onHide 生命周期
   */
  appHide() {
    if (this.status < 2) {
      return;
    }

    this.jscore.postMessage({
      type: 'appHide',
      body: {},
    });
  }

  /**
   * 触发 Page.onHide 生命周期
   */
  pageHide() {
    if (this.status < 2) {
      return;
    }

    this.jscore.postMessage({
      type: 'pageHide',
      body: {
        bridgeId: this.id,
      },
    });
  }

  /**
   * 启动 Bridge，通知双线程开始加载各自的资源
   */
  start() {
    // 通知渲染线程加载 view.js 和 style.css
    this.webview.postMessage({
      type: 'loadResource',
      body: {
        appId: this.opts.appId,
      },
    });

    // 通知逻辑线程加载 logic.js
    this.jscore.postMessage({
      type: 'loadResource',
      body: {
        appId: this.opts.appId,
        bridgeId: this.id,
      },
    });
  }

  /**
   * 【核心方法】将逻辑层的数据变更同步到渲染层
   * 这是 setData 跨线程通信的关键环节
   */
  updateModule(msg) {
    const { id, data } = msg;

    this.webview.postMessage({
      type: 'updateModule',
      body: {
        id,
        data,
      },
    });
  }

  /**
   * 初始化 Bridge，创建对应的 WebView
   */
  async init() {
    this.webview = await this.createWebview();
    // 监听来自渲染线程（WebView/iframe）的消息
    this.webview.addEventListener('message', this.uiMessageHandler.bind(this));
  }

  /**
   * 创建 WebView 实例（iframe）
   * @returns {Promise<WebView>} WebView 实例
   */
  createWebview() {
    return new Promise((resolve) => {
      const webview = new WebView({
        configInfo: this.opts.configInfo,
        isRoot: this.opts.isRoot,
      });

      webview.parent = this;
      webview.init(() => {
        resolve(webview);
      });
      // 将 iframe 添加到 DOM
      this.parent.webviewsContainer.appendChild(webview.el);
    });
  }

  /**
   * 将初始数据发送给渲染层，触发首次渲染
   */
  setInitialData(msg) {
    const { initialData } = msg.body;

    this.webview.postMessage({
      type: 'setInitialData',
      body: {
        initialData,
        bridgeId: this.id,
        pagePath: this.opts.pagePath,
      },
    });
  }

  /**
   * 渲染层 Vue 实例创建后，通知逻辑层创建对应的 Page 实例
   */
  uiInstanceCreated(msg) {
    const { id, path } = msg;

    this.jscore.postMessage({
      type: 'createInstance',
      body: {
        id,
        path,
        bridgeId: this.id,
        query: this.opts.query,
      },
    });
  }

  /**
   * 当双线程资源都加载完成后（status === 2），创建 App 实例
   */
  createApp() {
    if (this.status !== 2) {
      return;
    }

    this.jscore.postMessage({
      type: 'createApp',
      body: {
        bridgeId: this.id,
        scene: this.opts.scene,
        pagePath: this.opts.pagePath,
        query: this.opts.query,
      },
    });
  }
}
