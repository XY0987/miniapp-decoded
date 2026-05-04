/**
 * @file App 应用实例
 * @description 小程序 App 的运行时实例，管理应用级别的生命周期
 *
 * 生命周期：
 * - onLaunch: 小程序初始化完成时触发（全局只触发一次）
 * - onShow: 小程序启动或从后台进入前台时触发
 * - onHide: 小程序从前台进入后台时触发
 */
import { isFunction } from 'lodash';

/** App 的生命周期方法列表 */
const lifecycleMethods = ['onLaunch', 'onShow', 'onHide'];

/**
 * App - 应用实例类
 * 对应小程序开发者调用 App({...}) 注册的应用
 */
class App {
  /**
   * @param {Object} moduleInfo - 开发者定义的 App 配置
   * @param {Object} openInfo - 启动信息（scene, pagePath, query）
   */
  constructor(moduleInfo, openInfo) {
    this.moduleInfo = moduleInfo;
    this.openInfo = openInfo;
    this.init();
  }

  /**
   * 初始化 App 实例
   */
  init() {
    this.initLifecycle();
    this.callLifecycle();
  }

  /**
   * 初始化生命周期方法
   * 将开发者定义的生命周期函数绑定到当前实例
   */
  initLifecycle() {
    lifecycleMethods.forEach((name) => {
      if (!isFunction(this.moduleInfo[name])) {
        return;
      }
      // 绑定 this
      this[name] = this.moduleInfo[name].bind(this);
    });
  }

  /**
   * 首次启动时调用生命周期
   * 按顺序触发 onLaunch → onShow
   */
  callLifecycle() {
    const { scene, pagePath, query } = this.openInfo;
    const options = {
      scene,
      query,
      path: pagePath,
    };

    // 触发 onLaunch（首次启动）
    this.onLaunch(options);
    // 触发 onShow（进入前台）
    this.onShow(options);
  }

  /**
   * 从后台切回前台时调用
   * 仅触发 onShow
   */
  callShowLifecycle() {
    const { scene, pagePath, query } = this.openInfo;
    const options = {
      scene,
      query,
      path: pagePath,
    };

    this.onShow(options);
  }
}

export { App };
