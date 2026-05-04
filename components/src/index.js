/**
 * @file Components 组件库入口
 * @description 小程序基础组件库，模拟微信的 Exparser 组件系统
 *
 * 组件库说明：
 * - 使用 Vue 2 组件系统实现
 * - 将小程序标签（view、text 等）映射为 Vue 组件（ui-view、ui-text 等）
 * - 通过 componentProxy 统一处理事件代理
 *
 * 目前实现的组件：
 * - ui-view: 视图容器，支持 bindtap 等事件
 */
import '@/view/index';
