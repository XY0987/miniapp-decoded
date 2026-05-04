/**
 * @file MessageManager 消息管理器（渲染层）
 * @description 渲染层的消息处理中心，负责接收和处理来自 Native 层的指令
 *
 * 支持的消息类型：
 * - loadResource: 加载渲染层资源（view.js + style.css）
 * - setInitialData: 接收初始数据并首次渲染
 * - updateModule: 【核心】接收 setData 的数据变更，更新视图
 */
import message from '@/message';
import loader from '@/loader';
import runtimeManager from '@/runtimeManager';

/**
 * MessageManager - 消息管理器
 * 作为渲染层的消息路由，将不同类型的消息分发到对应的处理器
 */
class MessageManager {
  constructor() {
    this.message = message;
  }

  /**
   * 初始化消息监听
   */
  init() {
    /**
     * 加载渲染层资源
     * Native 通知渲染层开始加载 view.js 和 style.css
     */
    this.message.receive('loadResource', (msg) => {
      const { appId } = msg;

      loader.loadResources({
        appId,
      });
    });

    /**
     * 【核心】更新页面数据
     * 接收逻辑层 setData 的数据变更，通过 Vue.set 更新视图
     */
    this.message.receive('updateModule', (msg) => {
      const { id, data } = msg;

      runtimeManager.updateModule({
        id,
        data,
      });
    });

    /**
     * 设置初始数据并首次渲染
     * 逻辑层准备好 Page.data 后，发送给渲染层进行首次渲染
     */
    this.message.receive('setInitialData', (msg) => {
      const { bridgeId, pagePath } = msg;

      // 将初始数据设置到对应的 PageModule
      loader.setInitialData(msg.initialData);
      // 执行首次渲染（创建 Vue 实例）
      runtimeManager.firstRender({
        pagePath,
        bridgeId,
      });
    });
  }
}

export default new MessageManager();
