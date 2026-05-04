/**
 * @file PageModule 页面模块
 * @description 页面的静态定义，存储开发者注册的 Page 配置
 */

/**
 * PageModule - 页面模块类
 * 存储 Page({...}) 注册时的配置信息，等待实例化时使用
 */
export class PageModule {
  /**
   * @param {Object} moduleInfo - 开发者定义的 Page 配置（data, onLoad, methods...）
   * @param {Object} compileInfo - 编译器添加的信息（path 等）
   */
  constructor(moduleInfo, compileInfo) {
    this.type = 'page';
    this.moduleInfo = moduleInfo; // Page 配置对象
    this.compileInfo = compileInfo; // 编译信息
  }

  /**
   * 获取页面的初始数据
   * 用于首次渲染时发送给渲染层
   * @returns {Object} 初始数据
   */
  getInitialData() {
    const moduleData = this.moduleInfo.data || {};

    return {
      ...moduleData,
    };
  }
}
