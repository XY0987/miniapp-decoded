/**
 * @file MessageManager 消息管理器
 * @description 逻辑层的消息处理中心，负责接收和处理来自 Native 层的各种指令
 *
 * 支持的消息类型：
 * - loadResource: 加载小程序资源（logic.js）
 * - createApp: 创建 App 实例
 * - createInstance: 创建 Page 实例
 * - makePageInitialData: 准备页面初始数据
 * - appShow/appHide: App 生命周期
 * - pageShow/pageHide: Page 生命周期
 * - moduleMounted: 页面渲染完成（onReady）
 * - trrigerEvent: 用户事件触发（如 bindtap）
 * - pageScroll: 页面滚动事件
 */
import loader from '@/loader';
import message from '@/message';
import runtimeManager from '@/runtimeManager';

/**
 * MessageManager - 消息管理器
 * 作为逻辑层的消息路由，将不同类型的消息分发到对应的处理器
 */
class MessageManager {
  constructor() {
    this.message = message;
  }

  /**
   * 初始化消息监听
   * 注册所有消息类型的处理器
   */
  init() {
    /**
     * 加载小程序资源
     * Native 通知逻辑层开始加载业务代码
     */
    this.message.receive('loadResource', (msg) => {
      const { appId, bridgeId } = msg;

      loader.loadResources({
        appId,
        bridgeId,
      });
    });

    /**
     * 创建 App 实例
     * 资源加载完成后，创建 App 并触发 onLaunch
     */
    this.message.receive('createApp', (msg) => {
      const { bridgeId, scene, pagePath, query } = msg;

      runtimeManager.createApp({
        scene,
        pagePath,
        query,
      });
      // 通知 Native 层 App 已创建
      message.send({
        type: 'appIsCreated',
        body: {
          bridgeId,
        },
      });
    });

    /**
     * App 切换到前台
     * 触发 App.onShow 生命周期
     */
    this.message.receive('appShow', () => {
      runtimeManager.appShow();
    });

    /**
     * App 切换到后台
     * 触发 App.onHide 生命周期
     */
    this.message.receive('appHide', () => {
      runtimeManager.appHide();
    });

    /**
     * 页面显示
     * 触发 Page.onShow 生命周期
     */
    this.message.receive('pageShow', (msg) => {
      const { bridgeId } = msg;

      runtimeManager.pageShow({
        id: bridgeId,
      });
    });

    /**
     * 页面隐藏
     * 触发 Page.onHide 生命周期
     */
    this.message.receive('pageHide', (msg) => {
      const { bridgeId } = msg;

      runtimeManager.pageHide({
        id: bridgeId,
      });
    });

    /**
     * 【核心】用户事件触发
     * 渲染层的用户交互（如点击）通过此消息触发逻辑层的方法
     * 例如：bindtap="handleClick" → 执行 page.handleClick()
     */
    this.message.receive('trrigerEvent', (msg) => {
      const { id, methodName } = msg;

      runtimeManager.trrigerEvent({
        id,
        methodName,
      });
    });

    /**
     * 页面渲染完成
     * 触发 Page.onReady 生命周期
     */
    this.message.receive('moduleMounted', (msg) => {
      const { id } = msg;

      runtimeManager.pageReady({
        id,
      });
    });

    /**
     * 页面滚动
     * 触发 Page.onPageScroll 生命周期
     */
    this.message.receive('pageScroll', (msg) => {
      const { id, scrollTop } = msg;

      runtimeManager.pageScroll({
        id,
        scrollTop,
      });
    });

    /**
     * 创建 Page 实例
     * 渲染层 Vue 组件创建后，在逻辑层创建对应的 Page 实例
     */
    this.message.receive('createInstance', (msg) => {
      const { id, path, bridgeId, query } = msg;

      runtimeManager.createPage({
        id,
        path,
        bridgeId,
        query,
      });
    });

    /**
     * 准备页面初始数据
     * 在首次渲染前，将 Page.data 发送给渲染层
     */
    this.message.receive('makePageInitialData', (msg) => {
      const { pagePath, bridgeId } = msg;
      const initialData = loader.getInitialDataByPagePath(pagePath);

      message.send({
        type: 'initialDataIsReady',
        body: {
          bridgeId,
          initialData,
        },
      });
    });
  }
}

export default new MessageManager();
