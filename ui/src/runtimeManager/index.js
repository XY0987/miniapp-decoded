/**
 * @file RuntimeManager 运行时管理器（渲染层）
 * @description 管理渲染层的 Vue 实例，处理页面渲染和数据更新
 *
 * 核心职责：
 * 1. 首次渲染：创建 Vue 实例，挂载到 DOM
 * 2. 数据更新：接收 setData 的变更，使用 Vue.set 更新视图
 * 3. 生命周期通知：在 created/mounted 时通知逻辑层
 */
import { uuid } from '@/utils/util';
import loader from '@/loader';
import message from '@/message';

/**
 * RuntimeManager - 渲染层运行时管理器
 */
class RuntimeManager {
  constructor() {
    this.page = null; // 当前 Vue 实例
    this.pageId = ''; // 当前页面 ID
    this.uiInstance = {}; // Vue 实例集合 {id: vueInstance}
  }

  /**
   * 首次渲染
   * 创建 Vue 实例并挂载到 DOM
   * @param {Object} opts - {pagePath, bridgeId}
   */
  firstRender(opts) {
    const { pagePath, bridgeId } = opts;
    // 构造 Vue 配置对象
    const options = this.makeVueOptions({
      path: pagePath,
      bridgeId,
    });
    const root = document.querySelector('#root');

    this.pageId = bridgeId;
    // 创建 Vue 实例
    this.page = new Vue(options).$mount();
    // 挂载到 DOM
    root.appendChild(this.page.$el);

    // 监听页面滚动，转发给逻辑层的 onPageScroll
    root.addEventListener(
      'scroll',
      function () {
        message.send({
          type: 'pageScroll',
          body: {
            scrollTop: root.scrollTop,
            id: bridgeId,
          },
        });
      },
      false
    );
  }

  /**
   * 【核心方法】更新页面数据
   * 使用 Vue.set 确保响应式更新
   * @param {Object} opts - {id, data}
   */
  updateModule(opts) {
    const { id, data } = opts;
    const viewModule = this.uiInstance[id];

    // 使用 Vue.set 确保新属性也是响应式的
    for (let key in data) {
      Vue.set(viewModule, key, data[key]);
    }
  }

  /**
   * 构造 Vue 配置对象
   * @param {Object} opts - {path, bridgeId}
   * @returns {Object} Vue 配置
   */
  makeVueOptions(opts) {
    const { path, bridgeId } = opts;
    // 获取编译后的页面模块（包含 render 函数）
    const staticModule = loader.getModuleByPath(path);
    const self = this;

    return {
      /**
       * data 函数
       * 返回页面的初始数据（来自逻辑层的 Page.data）
       */
      data() {
        return {
          ...staticModule.data,
        };
      },

      /**
       * beforeCreate 钩子
       * 设置 Bridge 信息，用于组件获取页面 ID
       */
      beforeCreate() {
        this._bridgeInfo = {
          id: self.pageId,
        };
      },

      /**
       * created 钩子
       * 存储 Vue 实例引用，通知逻辑层创建对应的 Page 实例
       */
      created() {
        // 保存 Vue 实例引用，用于后续 updateModule
        self.uiInstance[self.pageId] = this;
        // 通知逻辑层：渲染层组件已创建
        message.send({
          type: 'moduleCreated',
          body: {
            id: self.pageId,
            path,
          },
        });
      },

      /**
       * mounted 钩子
       * 通知逻辑层触发 onReady 生命周期
       */
      mounted() {
        message.send({
          type: 'moduleMounted',
          body: {
            id: self.pageId,
          },
        });
      },

      /**
       * render 函数
       * 由编译器从 wxml 生成，使用 Vue 的虚拟 DOM
       */
      render: staticModule.moduleInfo.render,
    };
  }
}

export default new RuntimeManager();
