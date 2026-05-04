/**
 * @file WXML 编译器
 * @description 将小程序 WXML 模板编译为 Vue render 函数
 *
 * 编译流程：
 * 1. 读取 .wxml 文件
 * 2. 转换为 Vue 模板（标签映射：view → ui-view）
 * 3. 使用 vue-template-compiler 编译为 render 函数
 * 4. 包装成 modDefine 模块格式
 * 5. 合并写入 view.js
 *
 * 示例：
 * 输入（home.wxml）:
 *   <view bindtap="onClick">{{text}}</view>
 *
 * 输出（view.js 片段）:
 *   modDefine('pages/home/index', function() {
 *     var render = function() { ... }  // Vue render 函数
 *     Page({
 *       path: 'pages/home/index',
 *       render: render,
 *       scopeId: 'data-v-xxx'
 *     });
 *   })
 */
const fs = require('fs');
const vueCompiler = require('vue-template-compiler');
const { compileTemplate } = require('@vue/component-compiler-utils');
const { getWorkPath } = require('../../env');
const { toVueTemplate } = require('./toVueTemplate');
const { writeFile } = require('./writeFile');

/**
 * 编译所有 WXML 文件
 * @param {Object} moduleDeps - 模块依赖关系 {path: {moduleId}}
 */
function compileWxml(moduleDeps) {
  const list = [];

  // 遍历所有页面，逐个编译
  for (let path in moduleDeps) {
    const code = compile(path, moduleDeps[path].moduleId);

    list.push({
      code,
      path,
    });
  }

  // 合并写入 view.js
  writeFile(list);
}

/**
 * 编译单个 WXML 文件
 * @param {string} path - 页面路径（不含扩展名）
 * @param {string} moduleId - 模块 ID（用于 scoped CSS）
 * @returns {string} 编译后的代码
 */
function compile(path, moduleId) {
  const workPath = getWorkPath();
  const wxmlFullPath = `${workPath}/${path}.wxml`;

  // 1. 读取 WXML 文件内容
  const wxmlContent = fs.readFileSync(wxmlFullPath, { encoding: 'utf8' });

  // 2. 转换为 Vue 模板（view → ui-view 等）
  const vueTemplate = toVueTemplate(wxmlContent.trim());

  // 3. 使用 Vue 模板编译器生成 render 函数
  const compileResult = compileTemplate({
    source: vueTemplate,
    compiler: vueCompiler,
  });

  // 4. 包装成 modDefine 模块格式
  const code = `
		modDefine('${path}', function() {
			${compileResult.code}

			Page({
				path: '${path}',
				render: render,
				usingComponents: {},
				scopeId: 'data-v-${moduleId}'
			});
		})
	`;

  return code;
}

module.exports = {
  compileWxml,
};
