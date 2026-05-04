/**
 * @file PageModule 页面模块（渲染层）
 * @description 渲染层的页面模块，存储渲染配置和数据
 *
 * 与逻辑层 PageModule 的区别：
 * - 逻辑层：存储业务逻辑（data, methods, lifecycles）
 * - 渲染层：存储渲染信息（render, path, scopeId）+ 数据副本
 */

/**
 * PageModule - 页面模块类（渲染层版本）
 */
export class PageModule {
  /**
   * @param {Object} moduleInfo - 页面渲染配置（path, render, scopeId 等）
   */
  constructor(moduleInfo) {
    this.type = 'page';
    this.data = {}; // 页面数据（由逻辑层同步过来）
    this.moduleInfo = moduleInfo; // 渲染配置
  }

  /**
   * 设置初始数据
   * 由逻辑层同步 Page.data 到渲染层
   * @param {Object} data - 初始数据
   */
  setInitialData(data) {
    this.data = data;
  }
}
