/**
 * @file UI SDK 入口文件
 * @description 渲染层 SDK，运行在 iframe 中，使用 Vue 作为模板引擎
 *
 * 架构说明：
 * - 运行环境：iframe（独立的浏览器上下文）
 * - 模板引擎：Vue 2.x
 * - 通信方式：通过 JSBridge 与 Native 层通信
 * - 主要职责：渲染 UI、处理用户交互、响应数据变更
 *
 * 初始化流程：
 * 1. 初始化 JSBridge 命名空间
 * 2. globalApi.init() - 注入渲染层的 Page() 函数
 * 3. messageManager.init() - 开始监听来自 Native 的消息
 */
import '@/namespace'; // 初始化 JSBridge 命名空间
import messageManager from '@/messageManager';
import globalApi from '@/globalApi';

// 初始化全局 API（渲染层的 Page）
globalApi.init();
// 初始化消息管理器，开始处理来自 Native 的指令
messageManager.init();
