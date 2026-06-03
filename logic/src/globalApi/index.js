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

    /**
     * wx - 微信原生 API 对象（测试 demo）
     * 真机中由 WAService.js 注入，包含几百个 API
     * 这里仅做一个 showToast 的简单模拟，演示注入位置和通信链路
     */
    global.wx = {
      showToast({ title = '', icon = 'success', duration = 1500 } = {}) {
        console.log(`[wx.showToast] title: "${title}", icon: ${icon}, duration: ${duration}ms`);
        // 真机实现：通过 Bridge 发给 Native，由客户端弹出原生 Toast
        // 这里仅打印日志演示调用链路
      },
    };
  }
}

export default new GlobalApi();
