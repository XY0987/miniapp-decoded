/**
 * @file ui-view 组件
 * @description 模拟小程序的 <view> 组件
 *
 * 对应小程序标签：<view>
 * 映射为 Vue 组件：<ui-view>
 *
 * 支持的事件：
 * - bindtap: 点击事件
 *
 * 使用示例：
 * <ui-view bindtap="handleClick">点击我</ui-view>
 */
import template from './template.html';
import './style.scss';
import { componentProxy } from '@/proxy';

// 注册 ui-view 组件
componentProxy('ui-view', {
  template,

  methods: {
    /**
     * 点击事件处理
     * 触发 tap 自定义事件，被 componentProxy 拦截后
     * 会通过 JSBridge 转发给逻辑层
     */
    clicked() {
      this.$emit('tap');
    },
  },
});
