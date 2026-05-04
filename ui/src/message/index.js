/**
 * @file Message 消息通信模块（渲染层）
 * @description 渲染层（iframe）与 Native 通信的封装
 *
 * 通信机制：
 * - 接收：JSBridge.onReceiveNativeMessage（由 Native 调用）
 * - 发送：JSBridge.onReceiveUIMessage（通知 Native）
 *
 * 与逻辑层的区别：
 * - 逻辑层（Worker）使用 postMessage
 * - 渲染层（iframe）使用 JSBridge 对象上的方法
 */
import mitt from 'mitt';

/**
 * Message - iframe 消息通信类
 */
class Message {
  constructor() {
    this.event = mitt(); // 事件总线
    this.init();
  }

  /**
   * 初始化消息接收
   * 设置 JSBridge.onReceiveNativeMessage 的处理函数
   */
  init() {
    // 接收来自 Native 的消息
    window.JSBridge.onReceiveNativeMessage = (msg) => {
      const { type, body } = msg;

      // 根据消息类型分发
      this.event.emit(type, body);
    };
  }

  /**
   * 注册消息处理器
   * @param {string} type - 消息类型
   * @param {Function} callback - 处理函数
   */
  receive(type, callback) {
    this.event.on(type, callback);
  }

  /**
   * 发送消息给 Native 层
   * @param {Object} msg - 消息对象 {type, body}
   */
  send(msg) {
    // 通过 JSBridge 通知 Native
    window.JSBridge.onReceiveUIMessage(msg);
  }
}

export default new Message();
