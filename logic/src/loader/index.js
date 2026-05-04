/**
 * @file Loader 资源加载器
 * @description 负责加载小程序业务代码，管理模块定义
 *
 * 加载流程：
 * 1. 收到 loadResource 消息
 * 2. 通过 importScripts 加载小程序的 logic.js
 * 3. logic.js 执行时会调用 App() 和 Page()
 * 4. 这些调用会被 GlobalApi 拦截，调用 loader.createXxxModule
 * 5. 模块定义被存储在 staticModules 中，等待后续使用
 *
 * 真机对照：
 * - iOS/Android: 客户端下载代码包后，将 JS 代码交给 JSCore 执行
 * - 本 Demo: 从 native 的静态服务器 fetch 代码，用 importScripts 执行
 */
import message from '@/message';
import { AppModule } from './AppModule';
import { PageModule } from './PageModule';

/** 小程序资源的基础 URL（native 包提供的静态服务） */
const DEFAULT_APP_RESOURCE_BASE = 'http://127.0.0.1:3077/mini_resource';

/**
 * Loader - 资源加载器
 */
class Loader {
  constructor() {
    /** 静态模块存储 {path: PageModule, app: AppModule} */
    this.staticModules = {};
  }

  /**
   * 加载小程序资源
   * @param {Object} opts - {appId, bridgeId, resourceBase?}
   */
  loadResources(opts) {
    const { appId, bridgeId, resourceBase } = opts;
    const base = resourceBase || DEFAULT_APP_RESOURCE_BASE;
    const logicResourcePath = `${base}/${appId}/logic.js`;

    // 在 Worker 中使用 importScripts 加载脚本
    // 这会同步执行 logic.js，其中的 App() 和 Page() 调用会注册模块
    importScripts(logicResourcePath);

    // 通知 Native 资源加载完成
    message.send({
      type: 'logicResuorceLoaded',
      body: {
        bridgeId,
      },
    });
  }

  /**
   * 根据路径获取 Page 模块
   * @param {string} path - 页面路径
   * @returns {PageModule} 页面模块
   */
  getModuleByPath(path) {
    return this.staticModules[path];
  }

  /**
   * 创建 App 模块（被 GlobalApi 的 App() 调用）
   * @param {Object} moduleInfo - 开发者定义的 App 配置
   */
  createAppModule(moduleInfo) {
    const appModule = new AppModule(moduleInfo);

    this.staticModules.app = appModule;
  }

  /**
   * 创建 Page 模块（被 GlobalApi 的 Page() 调用）
   * @param {Object} moduleInfo - 开发者定义的 Page 配置
   * @param {Object} compileInfo - 编译器添加的信息（包含 path）
   */
  createPageModule(moduleInfo, compileInfo) {
    const pageModule = new PageModule(moduleInfo, compileInfo);
    const { path } = compileInfo;

    // 以页面路径为 key 存储
    this.staticModules[path] = pageModule;
  }

  /**
   * 获取页面的初始数据（用于首次渲染）
   * @param {string} pagePath - 页面路径
   * @returns {Object} {pagePath: initialData}
   */
  getInitialDataByPagePath(pagePath) {
    const pageModule = this.staticModules[pagePath];

    return {
      [pagePath]: pageModule.getInitialData(),
    };
  }
}

export default new Loader();
