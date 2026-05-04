/**
 * @file GlobalApi 全局 API 注入（渲染层）
 * @description 向 window 注入渲染层版本的 Page() 函数
 *
 * 与逻辑层的区别：
 * - 逻辑层的 Page() 注册业务逻辑和数据
 * - 渲染层的 Page() 注册 render 函数和视图配置
 *
 * 当渲染层的 view.js 被加载后，会调用 Page() 注册渲染相关的信息
 */
import loader from '@/loader';

/**
 * GlobalApi - 全局 API 管理器（渲染层）
 */
class GlobalApi {
  constructor() {}

  /**
   * 初始化全局 API
   */
  init() {
    /**
     * Page() - 注册页面的渲染配置
     * 由编译后的 view.js 调用
     * @param {Object} moduleInfo - 页面渲染配置（path, render, scopeId 等）
     */
    window.Page = (moduleInfo) => {
      loader.createPageModule(moduleInfo);
    };
  }
}

export default new GlobalApi();
