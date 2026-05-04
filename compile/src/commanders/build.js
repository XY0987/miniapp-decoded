/**
 * @file build 命令实现
 * @description 编译小程序源码的核心流程
 *
 * 编译流程：
 * 1. 保存编译环境信息
 * 2. 创建 dist 输出目录
 * 3. 编译 JSON 配置文件 → config.json
 * 4. 获取模块依赖关系
 * 5. 编译 WXML 模板 → view.js
 * 6. 编译 JS 逻辑 → logic.js
 * 7. 编译 WXSS 样式 → style.css
 *
 * 编译产物对照表：
 * | 源文件    | 产物        | 作用                    |
 * |----------|------------|------------------------|
 * | *.wxml   | view.js    | Vue render 函数        |
 * | *.wxss   | style.css  | rpx→rem + scoped 样式  |
 * | *.js     | logic.js   | AMD 风格模块           |
 * | *.json   | config.json| 应用配置               |
 */
const { saveEnvInfo } = require('../env');
const { createDist } = require('../toolkit/createDist');
const { compileJson } = require('../compile/json');
const { getModuleDeps } = require('../toolkit/getModuleDeps');
const { compileWxml } = require('../compile/wxml');
const { compileJS } = require('../compile/js');
const { compileWxss } = require('../compile/wxss');

/**
 * 执行编译
 * @param {string} publishPath - 发布路径（暂未使用）
 */
function build(publishPath) {
  // 1. 保存编译环境信息（工作目录、目标目录等）
  saveEnvInfo();

  // 2. 创建 dist 输出目录
  createDist();

  // 3. 编译 JSON 配置文件
  // 合并 app.json 和各页面的 *.json → config.json
  compileJson();

  // 4. 获取模块依赖关系（页面列表和对应的 moduleId）
  const moduleDeps = getModuleDeps();

  // 5. 编译 WXML 模板
  // wxml → Vue template → Vue render function → view.js
  compileWxml(moduleDeps);

  // 6. 编译 JS 逻辑
  // 包装成 AMD 风格的 modDefine，合并为 logic.js
  compileJS();

  // 7. 编译 WXSS 样式
  // rpx→rem 单位转换 + scopeId 隔离 → style.css
  compileWxss(moduleDeps);
}

module.exports = {
  build,
};
