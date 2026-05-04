/**
 * @file WXML 转 Vue 模板
 * @description 将小程序 WXML 语法转换为 Vue 模板语法
 *
 * 转换示例：
 * 输入（WXML）:
 *   <view class="home" bindtap="viewTap">
 *     {{text}}
 *   </view>
 *
 * 输出（Vue Template）:
 *   <ui-view class="home" bindtap="viewTap">
 *     {{text}}
 *   </ui-view>
 *
 * 主要转换：
 * - 标签名映射：view → ui-view
 * - 保留数据绑定：{{}} 语法不变
 * - 保留事件绑定：bindtap 等属性保持原样（由组件处理）
 */

const { parseHTML } = require('../../toolkit/parseHTML');
const { makeTagStart, makeTagEnd } = require('./tag');

/**
 * 将 WXML 转换为 Vue 模板
 * @param {string} wxmlContent - WXML 内容
 * @returns {string} Vue 模板字符串
 */
function toVueTemplate(wxmlContent) {
  const list = [];

  // 使用 HTML 解析器遍历 WXML
  parseHTML(wxmlContent, {
    /**
     * 处理开始标签
     * @param {string} tag - 标签名
     * @param {Array} attrs - 属性列表
     */
    start(tag, attrs) {
      // 转换标签名（view → ui-view）并处理属性
      const tagStart = makeTagStart({
        tag,
        attrs,
      });

      list.push(tagStart);
    },

    /**
     * 处理文本内容
     * @param {string} str - 文本内容（可能包含 {{}} 表达式）
     */
    chars(str) {
      list.push(str.trim());
    },

    /**
     * 处理结束标签
     * @param {string} tag - 标签名
     */
    end(tag) {
      const tagEnd = makeTagEnd(tag);

      list.push(tagEnd);
    },
  });

  return list.join('');
}

module.exports = {
  toVueTemplate,
};
