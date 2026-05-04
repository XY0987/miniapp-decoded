/**
 * @file AppModule 应用模块
 * @description 应用的静态定义，存储开发者注册的 App 配置
 */

/**
 * AppModule - 应用模块类
 * 存储 App({...}) 注册时的配置信息，等待实例化时使用
 */
export class AppModule {
  /**
   * @param {Object} moduleInfo - 开发者定义的 App 配置（onLaunch, onShow, onHide...）
   */
  constructor(moduleInfo) {
    this.type = 'app';
    this.moduleInfo = moduleInfo; // App 配置对象
  }
}
