/**
 * @file MiniAppSandbox 小程序沙箱
 * @description 小程序运行时容器，管理小程序的完整生命周期
 *
 * 职责：
 * 1. 创建和管理 JSCore（逻辑线程）
 * 2. 创建和管理 Bridge（通信桥）
 * 3. 管理多个 WebView（多页面栈）
 * 4. 处理小程序的启动流程（启动屏、配置加载等）
 * 5. 协调 App/Page 的生命周期
 *
 * 启动流程：
 * 1. 初始化 JSCore（创建 Web Worker）
 * 2. 显示启动屏，模拟资源下载
 * 3. 读取小程序配置文件 config.json
 * 4. 创建入口页面的 Bridge
 * 5. Bridge.start() 启动双线程资源加载
 * 6. 隐藏启动屏，显示页面
 */
import './style.scss';
import tpl from './tpl.html';
import { uuid, sleep } from '@native/utils/util';
import { AppManager } from '@native/core/appManager/appManager';
import { Bridge } from '@native/core/bridge';
import { JSCore } from '@native/core/jscore';
import { readFile, mergePageConfig } from './util';

/**
 * MiniAppSandbox - 小程序沙箱容器
 * 每个小程序实例对应一个 MiniAppSandbox
 */
export class MiniAppSandbox {
  constructor(opts) {
    this.appInfo = opts; // 小程序基本信息
    this.id = `ui_view${uuid()}`; // 沙箱唯一标识
    this.parent = null; // 父容器（Application）
    this.appId = opts.appId; // 小程序 AppID
    this.appConfig = null; // 小程序配置（从 config.json 读取）
    this.bridgeList = []; // Bridge 列表（支持多页面栈）
    this.jscore = new JSCore(); // 逻辑线程实例（所有页面共享一个）
    this.jscore.parent = this;
    this.webviewsContainer = null; // WebView 容器 DOM 元素
    this.el = document.createElement('div');
    this.el.classList.add('wx-native-view');
    // 监听 JSCore 消息（用于处理跨页面事件等）
    this.jscore.addEventListener('message', this.jscoreMessageHandler.bind(this));
  }

  /**
   * 视图加载完成回调（类似 iOS 的 viewDidLoad）
   * 初始化页面框架并启动小程序
   */
  viewDidLoad() {
    this.initPageFrame();
    this.webviewsContainer = this.el.querySelector('.wx-mini-app__webviews');
    this.showLaunchScreen();
    this.bindCloseEvent();
    this.initApp();
  }

  /**
   * 初始化小程序
   * 核心启动流程
   */
  async initApp() {
    // 初始化 JSCore（创建 Worker）
    await this.jscore.init();

    // 1. 模拟拉取小程序资源（真机需要下载代码包）
    await sleep(1000);

    // 2. 读取小程序配置文件
    const configPath = `${this.appInfo.appId}/config.json`;
    const configContent = await readFile(configPath);
    this.appConfig = JSON.parse(configContent);

    // 3. 根据入口页面配置设置状态栏颜色
    const entryPagePath = this.appInfo.pagePath || this.appConfig.app.entryPagePath;
    this.updateTargetPageColorStyle(entryPagePath);

    // 4. 创建入口页面的通信桥 Bridge
    // Bridge 是连接 WebView 和 JSCore 的核心
    const pageConfig = this.appConfig.modules[entryPagePath];
    const entryPageBridge = await this.createBridge({
      pagePath: entryPagePath,
      query: this.appInfo.query,
      scene: this.appInfo.scene,
      jscore: this.jscore,
      isRoot: true,
      appId: this.appInfo.appId,
      configInfo: mergePageConfig(this.appConfig.app, pageConfig),
    });

    this.bridgeList.push(entryPageBridge);
    // 启动双线程资源加载
    entryPageBridge.start();

    // 5. 隐藏启动屏
    this.hideLaunchScreen();
  }

  /**
   * 创建 Bridge 实例
   * @param {Object} opts - 配置选项
   * @returns {Promise<Bridge>} Bridge 实例
   */
  async createBridge(opts) {
    const { jscore, configInfo, isRoot, appId, pagePath, query, scene } = opts;
    const bridge = new Bridge({
      jscore,
      configInfo,
      isRoot,
      appId,
      pagePath,
      query,
      scene,
    });

    bridge.parent = this;
    await bridge.init();
    return bridge;
  }

  /**
   * 小程序被切换到前台时调用
   * 触发当前页面的 App.onShow 和 Page.onShow
   */
  onPresentIn() {
    const currentBridge = this.bridgeList[this.bridgeList.length - 1];

    currentBridge && currentBridge.appShow();
    currentBridge && currentBridge.pageShow();
  }

  /**
   * 小程序被切换到后台时调用
   * 触发当前页面的 App.onHide 和 Page.onHide
   */
  onPresentOut() {
    const currentBridge = this.bridgeList[this.bridgeList.length - 1];

    currentBridge && currentBridge.appHide();
    currentBridge && currentBridge.pageHide();
  }

  /**
   * 初始化页面框架 DOM
   */
  initPageFrame() {
    this.el.innerHTML = tpl;
  }

  /**
   * 根据页面配置更新状态栏颜色
   * @param {string} pagePath - 页面路径
   */
  updateTargetPageColorStyle(pagePath) {
    const pageConfig = this.appConfig.modules[pagePath];
    const mergeConfig = mergePageConfig(this.appConfig.app, pageConfig);
    const { navigationBarTextStyle } = mergeConfig;

    this.updateActionColorStyle(navigationBarTextStyle);
  }

  /**
   * 显示小程序启动屏（logo + 名称）
   */
  showLaunchScreen() {
    const launchScreen = this.el.querySelector('.wx-mini-app__launch-screen');
    const name = this.el.querySelector('.wx-mini-app__name');
    const logo = this.el.querySelector('.wx-mini-app__logo-img-url');

    this.updateActionColorStyle('black');
    name.innerHTML = this.appInfo.appName;
    logo.src = this.appInfo.logo;
    launchScreen.style.display = 'block';
  }

  /**
   * 隐藏启动屏，显示小程序页面
   */
  hideLaunchScreen() {
    const startPage = this.el.querySelector('.wx-mini-app__launch-screen');

    startPage.style.display = 'none';
  }

  /**
   * 更新操作栏（胶囊按钮区域）的颜色风格
   * @param {string} color - 'white' 或 'black'
   */
  updateActionColorStyle(color) {
    const action = this.el.querySelector('.wx-mini-app-navigation__actions');

    if (color === 'white') {
      action.classList.remove('wx-mini-app-navigation__actions--black');
      action.classList.add('wx-mini-app-navigation__actions--white');
    }

    if (color === 'black') {
      action.classList.remove('wx-mini-app-navigation__actions--white');
      action.classList.add('wx-mini-app-navigation__actions--black');
    }

    // 同步更新设备状态栏颜色
    this.parent.updateStatusBarColor(color);
  }

  /**
   * 处理 JSCore 消息（预留扩展点）
   */
  jscoreMessageHandler(msg) {
    // 可以在这里处理跨页面的消息
  }

  /**
   * 绑定关闭按钮事件
   * 点击胶囊中的关闭按钮退出小程序
   */
  bindCloseEvent() {
    const closeBtn = this.el.querySelector('.wx-mini-app-navigation__actions-close');

    closeBtn.onclick = () => {
      AppManager.closeApp(this);
    };
  }
}
