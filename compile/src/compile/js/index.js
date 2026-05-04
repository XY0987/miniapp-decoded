/**
 * @file JS 编译器
 * @description 将小程序 JS 文件编译为 AMD 风格的模块
 *
 * 编译流程：
 * 1. 读取 app.json 获取页面列表
 * 2. 按页面路径编译各 page.js
 * 3. 编译 app.js
 * 4. 合并写入 logic.js
 *
 * 示例：
 * 输入（pages/home/index.js）:
 *   Page({
 *     data: { text: 'hello' },
 *     onLoad() { ... }
 *   })
 *
 * 输出（logic.js 片段）:
 *   modDefine('pages/home/index', function() {
 *     Page({
 *       data: { text: 'hello' },
 *       onLoad() { ... }
 *     }, { path: 'pages/home/index' });
 *   })
 */
const { getAppConfigInfo, getWorkPath } = require('../../env');
const { buildByPagePath, buildByFullPath } = require('./buildByPagePath');
const { writeFile } = require('./writeFile');

/**
 * 编译所有 JS 文件
 */
function compileJS() {
  // 从 app.json 获取页面列表
  const { pages } = getAppConfigInfo();
  const workPath = getWorkPath();
  const appjsPath = `${workPath}/app.js`;
  const compileResult = [];

  // 1. 编译各页面的 JS
  pages.forEach((pagePath) => {
    buildByPagePath(pagePath, compileResult);
  });

  // 2. 编译 app.js
  buildByFullPath(appjsPath, compileResult);

  // 3. 合并写入 logic.js
  writeFile(compileResult);
}

module.exports = {
  compileJS,
};
