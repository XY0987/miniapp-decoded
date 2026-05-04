/**
 * @file JSBridge 命名空间初始化
 * @description 在 window 上挂载 JSBridge 对象，作为渲染层与 Native 通信的桥梁
 *
 * JSBridge 的两个核心方法（由 Native 层实现）：
 * - onReceiveNativeMessage: 接收来自 Native 的消息
 * - onReceiveUIMessage: 向 Native 发送消息
 *
 * 这里只初始化空对象，实际的方法由 Native 层的 WebView 类注入
 */
window.JSBridge = {};
