/**
 * @file GlobalApi 全局 API 注入
 * @description 向 Worker 的 global 对象注入 App() 和 Page() 全局函数
 *
 * 这是小程序开发者编写代码时使用的核心 API：
 * - App({...}) - 注册小程序实例
 * - Page({...}) - 注册页面实例
 *
 * 当小程序的 logic.js 被 importScripts 加载后，
 * 会调用这些全局函数来注册模块定义
 */
import loader from '@/loader';

/**
 * GlobalApi - 全局 API 管理器
 */
class GlobalApi {
  constructor() {}

  /**
   * 初始化全局 API
   * 向 Worker 的 global 对象注入 App() 和 Page() 函数
   */
  init() {
    /**
     * App() - 注册小程序实例
     * 开发者调用 App({onLaunch, onShow, onHide, ...})
     * @param {Object} moduleInfo - App 配置对象
     */
    global.App = (moduleInfo) => {
      loader.createAppModule(moduleInfo);
    };

    /**
     * Page() - 注册页面实例
     * 开发者调用 Page({data, onLoad, onShow, methods...})
     * @param {Object} moduleInfo - Page 配置对象
     * @param {Object} compileInfo - 编译信息（包含 path 等）
     */
    global.Page = (moduleInfo, compileInfo) => {
      loader.createPageModule(moduleInfo, compileInfo);
    };
  }
}

export default new GlobalApi();
