/**
 * @file RuntimeManager 运行时管理器
 * @description 管理逻辑层的 App 和 Page 实例，协调生命周期和事件处理
 *
 * 职责：
 * 1. 创建和管理 App 实例
 * 2. 创建和管理多个 Page 实例（支持多页面栈）
 * 3. 分发生命周期事件（onShow/onHide/onReady 等）
 * 4. 处理用户交互事件（trrigerEvent）
 */
import loader from '@/loader';
import { App } from './App';
import { Page } from './Page';

/**
 * RuntimeManager - 运行时管理器
 * 逻辑层实例的中央管理器
 */
class RuntimeManager {
  constructor() {
    this.app = null; // App 实例（全局唯一）
    this.pages = {}; // Page 实例集合 {id: Page}
  }

  /**
   * 创建 App 实例
   * 触发 App 的 onLaunch 和 onShow 生命周期
   * @param {Object} opts - 启动参数
   */
  createApp(opts) {
    const { scene, pagePath, query } = opts;
    // 获取开发者定义的 App 配置
    const appModuleInfo = loader.staticModules.app.moduleInfo;

    this.app = new App(appModuleInfo, {
      scene,
      pagePath,
      query,
    });
  }

  /**
   * 创建 Page 实例
   * 触发 Page 的 onLoad 和 onShow 生命周期
   * @param {Object} opts - 页面参数
   */
  createPage(opts) {
    const { id, path, bridgeId, query } = opts;
    // 获取开发者定义的 Page 配置
    const staticModule = loader.getModuleByPath(path);

    // 创建 Page 实例并存储
    this.pages[id] = new Page(staticModule, {
      id,
      bridgeId,
      path,
      query,
    });
    console.log('this.pages[id]:', this.pages[id]);
  }

  /**
   * 触发 App.onShow
   */
  appShow() {
    this.app.callShowLifecycle();
  }

  /**
   * 触发 App.onHide
   */
  appHide() {
    this.app.onHide();
  }

  /**
   * 触发 Page.onShow
   * @param {Object} opts - {id: bridgeId}
   */
  pageShow(opts) {
    const { id } = opts;
    const page = this.pages[id];

    page.onShow && page.onShow();
  }

  /**
   * 触发 Page.onHide
   * @param {Object} opts - {id: bridgeId}
   */
  pageHide(opts) {
    const { id } = opts;
    const page = this.pages[id];

    page.onHide && page.onHide();
  }

  /**
   * 触发 Page.onReady
   * 页面首次渲染完成时调用
   * @param {Object} opts - {id: bridgeId}
   */
  pageReady(opts) {
    const { id } = opts;
    const page = this.pages[id];

    page.onReady && page.onReady();
  }

  /**
   * 触发 Page.onPageScroll
   * @param {Object} opts - {id, scrollTop}
   */
  pageScroll(opts) {
    const { id, scrollTop } = opts;
    const page = this.pages[id];

    page.onPageScroll &&
      page.onPageScroll({
        scrollTop,
      });
  }

  /**
   * 【核心】触发用户交互事件
   * 调用 Page 上开发者定义的方法
   * @param {Object} opts - {id, methodName}
   */
  trrigerEvent(opts) {
    const { id, methodName } = opts;
    const page = this.pages[id];

    // 调用页面上的方法（如 handleClick）
    page[methodName] && page[methodName]();
  }
}

export default new RuntimeManager();
