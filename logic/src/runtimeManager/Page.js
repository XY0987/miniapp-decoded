/**
 * @file Page 页面实例
 * @description 小程序 Page 的运行时实例，管理页面数据和生命周期
 *
 * 核心功能：
 * 1. 数据管理（this.data）
 * 2. setData 实现（跨线程数据同步的关键）
 * 3. 生命周期方法绑定（onLoad/onShow/onReady/onHide/onUnload/onPageScroll）
 * 4. 自定义方法绑定（开发者定义的事件处理函数）
 */
import { cloneDeep, isFunction } from 'lodash';
import message from '@/message';

/** Page 的生命周期方法列表 */
const lifecycleMethods = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPageScroll'];

/**
 * Page - 页面实例类
 * 对应小程序开发者调用 Page({...}) 注册的页面
 */
export class Page {
  /**
   * @param {Object} pageModule - 页面模块（包含开发者定义的配置）
   * @param {Object} extraOption - 额外选项（id, bridgeId, path, query）
   */
  constructor(pageModule, extraOption) {
    this.pageModule = pageModule;
    this.extraOption = extraOption;
    this.id = extraOption.id;
    // 深拷贝初始数据，确保各实例数据隔离
    this.data = cloneDeep(pageModule.moduleInfo.data);
    // 初始化生命周期方法
    this.initLifecycle();
    // 初始化自定义方法
    this.initMethods();
    // 创建时自动触发 onLoad 和 onShow
    this.onLoad(this.extraOption.query || {});
    this.onShow();
  }

  /**
   * 初始化生命周期方法
   * 将开发者定义的生命周期函数绑定到当前实例
   */
  initLifecycle() {
    lifecycleMethods.forEach((name) => {
      if (!isFunction(this.pageModule.moduleInfo[name])) {
        return;
      }
      // 绑定 this，确保开发者代码中可以使用 this.data、this.setData
      this[name] = this.pageModule.moduleInfo[name].bind(this);
    });
  }

  /**
   * 初始化自定义方法
   * 将开发者定义的非生命周期函数绑定到当前实例
   * 例如：handleClick、onTap 等事件处理函数
   */
  initMethods() {
    const moduleInfo = this.pageModule.moduleInfo;

    for (let attr in moduleInfo) {
      // 过滤掉非函数和生命周期方法
      if (isFunction(moduleInfo[attr]) && !lifecycleMethods.includes(attr)) {
        this[attr] = moduleInfo[attr].bind(this);
      }
    }
  }

  /**
   * 【核心方法】setData - 更新页面数据
   * 这是小程序跨线程数据同步的核心实现
   *
   * 流程：
   * 1. 更新逻辑层的 this.data
   * 2. 通过 message.send 将新数据发送给 Native
   * 3. Native 转发给渲染层
   * 4. 渲染层使用 Vue.set 更新视图
   *
   * @param {Object} data - 要更新的数据 {key: value}
   */
  setData(data) {
    // 1. 更新本地数据
    for (let key in data) {
      this.data[key] = data[key];
    }

    // 2. 通知渲染层更新视图
    message.send({
      type: 'updateModule',
      body: {
        id: this.id,
        data: this.data,
        bridgeId: this.id,
      },
    });
  }
}
