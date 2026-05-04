/**
 * @file WebView 渲染层容器
 * @description 使用 iframe 模拟微信小程序的 WebView 渲染线程
 *
 * 真机对照：
 * - 每个小程序页面对应一个独立的 WebView
 * - 通过 WeixinJSBridge 与 Native 通信
 *
 * Web 模拟方案：
 * - 使用 iframe 模拟独立的渲染环境
 * - 通过 window.frames[name] 直接调用 iframe 内的函数
 * - iframe 内部挂载 JSBridge 对象用于双向通信
 */
import mitt from 'mitt';
import './style.scss';
import tpl from './tpl.html';
import { uuid } from '@native/utils/util';

/**
 * WebView - 渲染层容器（iframe 封装）
 * 负责承载页面的 UI 渲染，与 Native 层通过 JSBridge 通信
 */
export class WebView {
  constructor(opts) {
    this.opts = opts;
    this.id = `webview_${uuid()}`; // WebView 唯一标识
    this.el = document.createElement('div'); // DOM 容器
    this.el.classList.add('wx-native-view');
    this.el.innerHTML = tpl;
    this.setInitialStyle();
    // 获取 iframe 元素并设置 name 属性（用于 window.frames 访问）
    this.iframe = this.el.querySelector('.wx-native-webview__window');
    this.iframe.name = this.id;
    this.event = mitt(); // 事件总线
  }

  /**
   * 初始化 WebView
   * 等待 iframe 加载完成，然后建立 JSBridge 通信通道
   * @param {Function} callback - 初始化完成回调
   */
  async init(callback) {
    await this.frameLoaded();
    // 通过 iframe name 获取其 window 对象
    const iframeWindow = window.frames[this.iframe.name];

    // 建立通信通道：渲染层 → Native 层
    // iframe 内部调用 JSBridge.onReceiveUIMessage 时，
    // 消息会通过事件系统传递到 Bridge
    iframeWindow.JSBridge.onReceiveUIMessage = (msg) => {
      this.event.emit('message', msg);
    };
    callback && callback();
  }

  /**
   * 添加消息监听器
   */
  addEventListener(type, handler) {
    this.event.on(type, handler);
  }

  /**
   * 向 iframe（渲染层）发送消息
   * Native → 渲染层
   * @param {Object} msg - 消息对象
   */
  postMessage(msg) {
    const iframeWindow = window.frames[this.iframe.name];
    // 调用 iframe 内的 JSBridge.onReceiveNativeMessage 方法
    iframeWindow.JSBridge.onReceiveNativeMessage(msg);
  }

  /**
   * 等待 iframe 加载完成
   * @returns {Promise} 加载完成的 Promise
   */
  frameLoaded() {
    return new Promise((resolve) => {
      this.iframe.onload = () => {
        resolve();
      };
    });
  }

  /**
   * 根据页面配置设置 WebView 的初始样式
   * 包括：导航栏颜色、导航栏标题、背景色、返回按钮等
   */
  setInitialStyle() {
    const config = this.opts.configInfo;
    const webview = this.el.querySelector('.wx-native-webview');
    const pageName = this.el.querySelector('.wx-native-webview__navigation-title');
    const navigationBar = this.el.querySelector('.wx-native-webview__navigation');
    const leftBtn = this.el.querySelector('.wx-native-webview__navigation-left-btn');
    const root = this.el.querySelector('.wx-native-webview__root');

    // 根页面不显示返回按钮
    if (this.opts.isRoot) {
      leftBtn.style.display = 'none';
    } else {
      leftBtn.style.display = 'block';
    }

    // 设置导航栏文字颜色（白色/黑色）
    if (config.navigationBarTextStyle === 'white') {
      navigationBar.classList.add('wx-native-webview__navigation--white');
    } else {
      navigationBar.classList.add('wx-native-webview__navigation--black');
    }

    // 自定义导航栏模式（隐藏默认导航栏）
    if (config.navigationStyle === 'custom') {
      webview.classList.add('wx-native-webview--custom-nav');
    }

    // 设置页面背景色和导航栏背景色
    root.style.backgroundColor = config.backgroundColor;
    navigationBar.style.backgroundColor = config.navigationBarBackgroundColor;
    // 设置导航栏标题文字
    pageName.innerText = config.navigationBarTitleText;
  }
}
