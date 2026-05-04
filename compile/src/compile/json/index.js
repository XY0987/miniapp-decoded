/**
 * @file JSON 编译器
 * @description 合并 app.json 和各页面 json 配置
 *
 * 输出格式（config.json）：
 * {
 *   "app": {
 *     "pages": ["pages/home/index", ...],
 *     "entryPagePath": "pages/home/index",
 *     "window": { ... }
 *   },
 *   "modules": {
 *     "pages/home/index": {
 *       "navigationBarTitleText": "首页",
 *       ...
 *     }
 *   }
 * }
 */
const fs = require('fs');
const { getAppConfigInfo, getModuleConfigInfo, getTargetPath } = require('../../env');

/**
 * 编译 JSON 配置
 * 合并 app.json 和各页面的 json 配置
 */
function compileJson() {
  const distPath = getTargetPath();

  // 构建配置结构
  const compileResultInfo = {
    app: getAppConfigInfo(), // 应用级配置（来自 app.json）
    modules: getModuleConfigInfo(), // 页面级配置（各页面的 *.json）
  };

  // 格式化输出
  const jsonStr = JSON.stringify(compileResultInfo, null, 4);

  // 写入 config.json
  fs.writeFileSync(`${distPath}/config.json`, jsonStr);
}

module.exports = {
  compileJson,
};
