/**
 * @file Message 消息通信模块
 * @description 逻辑层（Worker）与外界通信的封装
 *
 * 通信机制：
 * - 接收：global.addEventListener('message') 监听来自 Native 的消息
 * - 发送：global.postMessage() 向 Native 发送消息
 *
 * 消息格式：
 * {
 *   type: string,  // 消息类型
 *   body: object   // 消息内容
 * }
 */
import mitt from 'mitt';

/**
 * Message - Worker 消息通信类
 */
class Message {
  constructor() {
    this.event = mitt(); // 事件总线，用于消息分发
    this.init();
  }

  /**
   * 初始化消息监听
   * 监听 Worker 的 message 事件，将消息通过事件总线分发
   */
  init() {
    global.addEventListener('message', (e) => {
      const msg = e.data;
      const { type, body } = msg;

      // 根据消息类型分发到对应的处理器
      this.event.emit(type, body);
    });
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
    global.postMessage(msg);
  }
}

export default new Message();
