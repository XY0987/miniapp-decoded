/**
 * @file AppManager 小程序管理器
 * @description 管理已打开的小程序实例，支持缓存复用
 *
 * 功能：
 * 1. 打开小程序（首次打开创建新实例，再次打开复用缓存）
 * 2. 关闭小程序（不销毁实例，保留在缓存中）
 * 3. 小程序实例查询
 *
 * 这与微信的小程序热启动机制类似：
 * - 首次打开：冷启动，创建新的小程序沙箱
 * - 再次打开：热启动，复用之前的实例
 */
import { queryPath } from '@native/utils/util';
import { getMiniAppInfo } from '@native/services';
import { MiniAppSandbox } from '@native/core/miniAppSandbox/miniAppSandbox';

/**
 * AppManager - 小程序管理器（静态类）
 */
export class AppManager {
  /** 小程序实例栈（用于缓存和复用） */
  static appStack = [];

  /**
   * 打开小程序
   * @param {Object} opts - 打开参数
   * @param {string} opts.appId - 小程序 AppID
   * @param {string} opts.path - 打开路径（可带 query 参数）
   * @param {number} opts.scene - 场景值
   * @param {Application} wx - 微信应用实例
   */
  static async openApp(opts, wx) {
    const { appId, path, scene } = opts;
    // 解析路径和查询参数
    const { pagePath, query } = queryPath(path);
    // 获取小程序基本信息（名称、logo）
    const { appName, logo } = await getMiniAppInfo(appId);
    // 检查是否有缓存的实例
    const cacheApp = this.getAppById(appId);

    if (cacheApp) {
      // 热启动：复用缓存的实例
      wx.presentView(cacheApp, true);
    } else {
      // 冷启动：创建新的小程序沙箱实例
      const miniApp = new MiniAppSandbox({
        appId,
        scene,
        appName,
        logo,
        pagePath,
        query,
      });

      // 加入实例栈
      this.appStack.push(miniApp);
      // 以模态方式展示小程序
      wx.presentView(miniApp, false);
    }
  }

  /**
   * 根据 AppID 查找缓存的小程序实例
   * @param {string} appId - 小程序 AppID
   * @returns {MiniAppSandbox|null} 小程序实例或 null
   */
  static getAppById(appId) {
    for (let i = 0; i < this.appStack.length; i++) {
      if (this.appStack[i].appId === appId) {
        return this.appStack[i];
      }
    }

    return null;
  }

  /**
   * 关闭小程序（不销毁实例）
   * @param {MiniAppSandbox} miniApp - 小程序实例
   */
  static closeApp(miniApp) {
    // destroy: false 表示不销毁 DOM，保留在缓存中
    miniApp.parent.dismissView({
      destroy: false,
    });
  }
}
