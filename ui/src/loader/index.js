/**
 * @file Loader 资源加载器（渲染层）
 * @description 负责加载渲染层资源（view.js + style.css），管理页面模块
 *
 * 加载的资源：
 * - view.js: 编译后的渲染函数（Vue render）
 * - style.css: 编译后的样式（rpx→rem + scoped）
 *
 * 加载流程：
 * 1. 创建 <script> 和 <link> 标签
 * 2. 动态加载 view.js 和 style.css
 * 3. view.js 执行时调用 Page() 注册页面模块
 * 4. 资源加载完成后通知 Native
 */
import message from '@/message';
import { PageModule } from './PageModule';

/**
 * Loader - 渲染层资源加载器
 */
class Loader {
  constructor() {
    /** 静态模块存储 {path: PageModule} */
    this.staticModules = {};
  }

  /**
   * 加载渲染层资源
   * @param {Object} opts - {appId}
   */
  loadResources(opts) {
    const { appId } = opts;
    // 资源路径（由 native 包的静态服务器提供）
    const viewResourcePath = `/mini_resource/${appId}/view.js`;
    const styleResourcePath = `/mini_resource/${appId}/style.css`;
    const script = document.createElement('script');
    const link = document.createElement('link');

    // 并行加载 JS 和 CSS
    Promise.all([
      this.loadStyleFile(link, styleResourcePath),
      this.loadScriptFile(script, viewResourcePath),
    ]).then(() => {
      // 通知 Native 渲染层资源加载完成
      message.send({
        type: 'uiResourceLoaded',
        body: {},
      });
    });
  }

  /**
   * 加载样式文件
   * @param {HTMLLinkElement} link - link 元素
   * @param {string} path - 样式文件路径
   * @returns {Promise} 加载完成的 Promise
   */
  loadStyleFile(link, path) {
    return new Promise((resolve) => {
      link.rel = 'stylesheet';
      link.href = path;
      link.onload = () => {
        resolve();
      };
      document.body.appendChild(link);
    });
  }

  /**
   * 加载脚本文件
   * @param {HTMLScriptElement} script - script 元素
   * @param {string} path - 脚本文件路径
   * @returns {Promise} 加载完成的 Promise
   */
  loadScriptFile(script, path) {
    return new Promise((resolve) => {
      script.src = path;
      script.onload = () => {
        resolve();
      };
      document.body.appendChild(script);
    });
  }

  /**
   * 创建页面模块（被 GlobalApi 的 Page() 调用）
   * @param {Object} moduleInfo - 页面渲染配置（path, render 等）
   */
  createPageModule(moduleInfo) {
    const pageModule = new PageModule(moduleInfo);
    const { path } = moduleInfo;

    // 以页面路径为 key 存储
    this.staticModules[path] = pageModule;
  }

  /**
   * 根据路径获取页面模块
   * @param {string} path - 页面路径
   * @returns {PageModule} 页面模块
   */
  getModuleByPath(path) {
    return this.staticModules[path];
  }

  /**
   * 设置页面的初始数据
   * 将逻辑层的 Page.data 同步到渲染层的 PageModule
   * @param {Object} initialData - {pagePath: data}
   */
  setInitialData(initialData) {
    for (let [path, data] of Object.entries(initialData)) {
      const staticModule = this.staticModules[path];

      if (!staticModule) {
        continue;
      }

      staticModule.setInitialData(data);
    }
  }
}

export default new Loader();
