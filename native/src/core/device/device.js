/**
 * @file Device 设备模拟器
 * @description 模拟 iPhone 设备外壳，提供状态栏和底部指示条的显示
 *
 * 功能：
 * 1. 渲染 iPhone 设备外壳（刘海、边框等）
 * 2. 管理状态栏颜色（随页面配置切换黑/白）
 * 3. 管理底部 Home 指示条颜色
 * 4. 承载微信应用（Application）
 */
import './device.scss';
import tpl from './device.html';

/**
 * Device - iPhone 设备模拟器
 */
export class Device {
  constructor() {
    this.appContainer = null; // 应用容器区域
    this.root = document.querySelector('#root');
    this.init();
  }

  /**
   * 初始化设备 DOM 和默认样式
   */
  init() {
    this.root.innerHTML = tpl;
    this.appContainer = this.root.querySelector('.iphone__apps');
    // 默认使用黑色状态栏
    this.updateDeviceBarColor('black');
  }

  /**
   * 更新设备状态栏和底部指示条的颜色
   * @param {string} color - 'black' 或 'white'
   */
  updateDeviceBarColor(color) {
    const statusBar = this.root.querySelector('.iphone__status-bar');
    const homeBar = this.root.querySelector('.iphone__home-touch-bar');

    if (color === 'black') {
      // 黑色文字/图标（用于浅色背景页面）
      statusBar.classList.remove('iphone__status-bar--white');
      statusBar.classList.add('iphone__status-bar--black');

      homeBar.classList.remove('iphone__home-touch-bar--white');
      homeBar.classList.add('iphone__home-touch-bar--black');
    }

    if (color === 'white') {
      // 白色文字/图标（用于深色背景页面）
      statusBar.classList.add('iphone__status-bar--white');
      statusBar.classList.remove('iphone__status-bar--black');

      homeBar.classList.add('iphone__home-touch-bar--white');
      homeBar.classList.remove('iphone__home-touch-bar--black');
    }
  }

  /**
   * 在设备中打开一个应用
   * @param {Application} app - 应用实例
   */
  open(app) {
    app.parent = this;
    this.appContainer.appendChild(app.el);
  }
}
