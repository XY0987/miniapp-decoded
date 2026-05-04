/**
 * @file Logic SDK 入口文件
 * @description 逻辑层 SDK，运行在 Web Worker 中，模拟小程序的 JSCore 环境
 *
 * 架构说明：
 * - 运行环境：Web Worker（无 DOM/BOM）
 * - 通信方式：通过 postMessage 与 Native 层通信
 * - 主要职责：执行业务逻辑、管理数据、处理生命周期
 *
 * 初始化流程：
 * 1. globalApi.init() - 向 global 注入 App() 和 Page() 全局函数
 * 2. messageManager.init() - 开始监听来自 Native 的消息
 */
import messageManager from '@/messageManager';
import globalApi from '@/globalApi';

// 初始化全局 API（App、Page）
globalApi.init();
// 初始化消息管理器，开始处理来自 Native 的指令
messageManager.init();
