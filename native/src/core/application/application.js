/**
 * @file Application 应用容器
 * @description 模拟微信客户端的视图栈管理，支持 push/pop/present/dismiss 动画
 *
 * 视图切换类型：
 * 1. push/pop - 水平滑动动画（页面导航）
 * 2. present/dismiss - 垂直滑动动画（模态展示，如打开小程序）
 *
 * 视图栈模型：
 * [Home] → push → [MiniAppList] → present → [MiniApp]
 *
 * 动画实现：
 * - 使用 CSS class 切换 + transition 实现过渡动画
 * - 动画时长约 540ms
 * - 使用 done 标志防止动画过程中的重复触发
 */
import './application.scss';
import { uuid, sleep } from '@native/utils/util';

/**
 * Application - 微信应用容器
 * 管理视图栈和页面切换动画
 */
export class Application {
  constructor() {
    this.el = null; // 应用根 DOM 元素
    this.window = null; // 窗口容器
    this.views = []; // 视图栈
    this.rootView = null; // 根视图
    this.parent = null; // 父容器（Device）
    this.done = true; // 动画完成标志（防抖）
    this.init();
  }

  /**
   * 初始化应用容器 DOM 结构
   */
  init() {
    this.el = document.createElement('div');
    this.el.classList.add('wx-application');
    this.window = document.createElement('div');
    this.window.classList.add('wx-native-window');
    this.el.appendChild(this.window);
  }

  /**
   * 初始化根视图
   * @param {Object} view - 根视图对象
   */
  initRootView(view) {
    this.rootView = view;
    view.parent = this;
    view.el.classList.add('wx-native-view--instage');
    view.el.style.zIndex = 1;
    this.views.push(view);
    this.window.appendChild(view.el);
    // 触发视图的 viewDidLoad 生命周期
    view.viewDidLoad && view.viewDidLoad();
  }

  /**
   * 推入新视图（水平滑动动画，从右向左）
   * 用于页面导航场景
   * @param {Object} view - 要推入的视图
   */
  async pushView(view) {
    // 防抖：动画进行中不允许重复操作
    if (!this.done) {
      return;
    }
    this.done = false;

    // 获取当前视图（将被推出）
    const preView = this.views[this.views.length - 1];

    // 新视图入栈
    view.parent = this;
    this.views.push(view);
    view.el.style.zIndex = this.views.length;
    view.el.classList.add('wx-native-view--before-enter');
    this.window.appendChild(view.el);
    view.viewDidLoad && view.viewDidLoad();
    await sleep(1);

    // 当前视图向左滑出
    preView.el.classList.remove('wx-native-view--instage');
    preView.el.classList.add('wx-native-view--slide-out');
    preView.el.classList.add('wx-native-view--linear-anima');

    // 新视图向左滑入
    view.el.classList.add('wx-native-view--enter-anima');
    view.el.classList.add('wx-native-view--instage');
    await sleep(540); // 等待动画完成
    this.done = true;

    // 清理动画相关的 class
    preView.el.classList.remove('wx-native-view--linear-anima');
    view.el.classList.remove('wx-native-view--before-enter');
    view.el.classList.remove('wx-native-view--enter-anima');
    view.el.classList.remove('wx-native-view--instage');
  }

  /**
   * 弹出当前视图（水平滑动动画，从左向右）
   * 用于返回上一页场景
   */
  async popView() {
    // 至少需要两个视图才能 pop
    if (this.views.length < 2) {
      return;
    }

    if (!this.done) {
      return;
    }

    this.done = false;

    const preView = this.views[this.views.length - 2]; // 将要显示的视图
    const currentView = this.views[this.views.length - 1]; // 将要移除的视图

    // 上一个视图滑入
    preView.el.classList.remove('wx-native-view--slide-out');
    preView.el.classList.add('wx-native-view--instage');
    preView.el.classList.add('wx-native-view--enter-anima');

    // 当前视图滑出
    currentView.el.classList.remove('wx-native-view--instage');
    currentView.el.classList.add('wx-native-view--before-enter');
    currentView.el.classList.add('wx-native-view--enter-anima');

    await sleep(540);
    this.done = true;
    // 出栈并移除 DOM
    this.views.pop();
    this.window.removeChild(currentView.el);
    preView.el.classList.remove('wx-native-view--enter-anima');
  }

  /**
   * 模态展示视图（垂直滑动动画，从下向上）
   * 用于打开小程序等场景
   * @param {Object} view - 要展示的视图
   * @param {boolean} useCache - 是否使用缓存（复用已存在的视图）
   */
  async presentView(view, useCache) {
    if (!this.done) {
      return;
    }
    this.done = false;

    const preView = this.views[this.views.length - 1];

    view.parent = this;
    view.el.style.zIndex = this.views.length + 1;
    view.el.classList.add('wx-native-view--before-present');
    view.el.classList.add('wx-native-view--enter-anima');
    // 底层视图准备缩小
    preView.el.classList.add('wx-native-view--before-presenting');
    preView.el.classList.remove('wx-native-view--instage');
    preView.el.classList.add('wx-native-view--enter-anima');
    // 触发生命周期
    preView.onPresentOut && preView.onPresentOut();
    view.onPresentIn && view.onPresentIn();
    // 非缓存模式才添加 DOM
    !useCache && this.el.appendChild(view.el);
    this.views.push(view);
    !useCache && view.viewDidLoad && view.viewDidLoad();
    await sleep(20);
    // 底层视图缩小
    preView.el.classList.add('wx-native-view--presenting');
    // 新视图滑入到位
    view.el.classList.add('wx-native-view--instage');
    await sleep(540);
    this.done = true;
    // 清理动画 class
    view.el.classList.remove('wx-native-view--before-present');
    view.el.classList.remove('wx-native-view--enter-anima');
    preView.el.classList.remove('wx-native-view--enter-anima');
    preView.el.classList.remove('wx-native-view--before-presenting');
  }

  /**
   * 关闭模态视图（垂直滑动动画，从上向下）
   * 用于关闭小程序等场景
   * @param {Object} opts - 配置选项
   * @param {boolean} opts.destroy - 是否销毁 DOM（默认 true）
   */
  async dismissView(opts = {}) {
    if (!this.done) {
      return;
    }
    this.done = false;

    const preView = this.views[this.views.length - 2]; // 将要显示的底层视图
    const currentView = this.views[this.views.length - 1]; // 将要关闭的视图
    const { destroy = true } = opts;

    currentView.el.classList.add('wx-native-view--enter-anima');
    preView.el.classList.add('wx-native-view--enter-anima');
    preView.el.classList.add('wx-native-view--before-presenting');
    await sleep(0);
    // 当前视图向下滑出
    currentView.el.classList.add('wx-native-view--before-present');
    currentView.el.classList.remove('wx-native-view--instage');
    // 底层视图恢复原状
    preView.el.classList.remove('wx-native-view--presenting');

    // 触发生命周期
    preView.onPresentIn && preView.onPresentIn();
    currentView.onPresentOut && currentView.onPresentOut();

    await sleep(540);
    this.done = true;
    // 根据 destroy 参数决定是否移除 DOM
    destroy && this.el.removeChild(currentView.el);
    this.views.pop();
    preView.el.classList.remove('wx-native-view--enter-anima');
    preView.el.classList.remove('wx-native-view--before-presenting');
  }

  /**
   * 更新设备状态栏颜色
   * @param {string} color - 'white' 或 'black'
   */
  updateStatusBarColor(color) {
    this.parent.updateDeviceBarColor && this.parent.updateDeviceBarColor(color);
  }
}
