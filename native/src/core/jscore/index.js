/**
 * @file JSCore 沙箱模拟
 * @description 使用 Web Worker 模拟微信小程序的 JSCore 逻辑线程
 *
 * 真机对照：
 * - iOS: 运行在 JavaScriptCore 引擎
 * - Android: 运行在 V8 引擎
 * - 共同特点: 无 DOM/BOM，是一个纯 JS 执行沙箱
 *
 * Web 模拟方案：
 * - Web Worker 是最接近 JSCore 的实现
 * - 独立的 JS 执行上下文
 * - 没有 window/document
 * - 只能通过 postMessage 与外界通信
 *
 * 实现细节：
 * - 由于浏览器同源策略，不能直接 new Worker(跨域URL)
 * - 所以先 fetch 拉取 logic SDK 代码，再用 Blob 创建 Worker
 */
import mitt from 'mitt';

// 逻辑层 SDK 地址，logic 包启动后在此端口提供服务
const LOGIC_SDK_URL =
  (typeof window !== 'undefined' && window.__LOGIC_SDK_URL__) ||
  'http://127.0.0.1:3100/logic/core.js';

/**
 * JSCore - 逻辑线程沙箱
 * 封装了 Web Worker，模拟小程序的 JSCore 环境
 */
export class JSCore {
  constructor() {
    this.parent = null; // 父容器（MiniAppSandbox）
    this.worker = null; // Web Worker 实例
    this.event = mitt(); // 事件总线，用于消息分发
  }

  /**
   * 初始化 JSCore
   * 通过 Blob URL 方式创建 Worker，绕过跨域限制
   */
  async init() {
    // 1. Fetch 拉取逻辑层 SDK 代码
    const jsContent = await fetch(LOGIC_SDK_URL);
    const codeString = await jsContent.text();

    // 2. 将代码字符串包装成 Blob
    const jsBlob = new Blob([codeString], {
      type: 'application/javascript',
    });

    // 3. 创建 Blob URL，用于实例化 Worker
    const urlObj = window.URL.createObjectURL(jsBlob);

    // 4. 创建 Worker 实例
    this.worker = new Worker(urlObj);

    // 5. 监听 Worker 消息，通过事件总线分发
    this.worker.addEventListener('message', (e) => {
      const msg = e.data;
      // 将消息通过 mitt 事件系统分发出去
      this.event.emit('message', msg);
    });
  }

  /**
   * 添加消息监听器
   * @param {string} type - 事件类型
   * @param {Function} handler - 处理函数
   */
  addEventListener(type, handler) {
    this.event.on(type, handler);
  }

  /**
   * 向 Worker（逻辑线程）发送消息
   * @param {Object} msg - 消息对象
   */
  postMessage(msg) {
    this.worker.postMessage(msg);
  }
}
