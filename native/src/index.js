/**
 * @file Native 层入口文件
 * @description 模拟微信客户端的入口，负责初始化设备、应用和首页
 *
 * 架构说明：
 * - Device: 模拟 iPhone 设备外壳，提供状态栏颜色切换等功能
 * - Application: 模拟微信应用容器，管理视图栈（push/pop/present/dismiss）
 * - Home: 微信首页视图
 */
import '@native/scss/app.scss';
import { Device } from '@native/core/device/device';
import { Application } from '@native/core/application/application';
import { Home } from '@native/pages/home/home';

/**
 * 页面加载完成后初始化整个模拟器
 * 启动流程：创建设备 → 创建微信应用 → 创建首页 → 挂载视图
 */
window.onload = function () {
  // 创建 iPhone 设备外壳
  const device = new Device();
  // 创建微信应用实例（视图栈管理器）
  const wx = new Application();
  // 创建微信首页
  const homePage = new Home();

  // 将首页设置为应用的根视图
  wx.initRootView(homePage);
  // 将应用挂载到设备上
  device.open(wx);
};
