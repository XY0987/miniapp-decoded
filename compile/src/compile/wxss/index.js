/**
 * @file WXSS 编译器
 * @description 将小程序 WXSS 样式编译为标准 CSS
 *
 * 编译功能：
 * 1. rpx → rem 单位转换
 * 2. 添加 scoped CSS（通过属性选择器）
 * 3. autoprefixer 自动添加浏览器前缀
 * 4. 合并所有样式为 style.css
 *
 * 示例：
 * 输入（home.wxss）:
 *   .container {
 *     padding: 20rpx;
 *     font-size: 28rpx;
 *   }
 *
 * 输出（style.css 片段）:
 *   .container[data-v-abc123] {
 *     padding: 20rem;
 *     font-size: 28rem;
 *   }
 */
const fs = require('fs');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const { getWorkPath, getTargetPath } = require('../../env');

/**
 * 编译所有 WXSS 文件
 * @param {Object} moduleDeps - 模块依赖关系 {path: {moduleId}}
 */
async function compileWxss(moduleDeps) {
  // 先编译 app.wxss（全局样式，不加 scopeId）
  let cssMergeCode = await getCompileCssCode({
    path: 'app',
    moduleId: '',
  });
  const distPath = getTargetPath();

  // 逐个编译各页面的 wxss
  for (const path in moduleDeps) {
    cssMergeCode += await getCompileCssCode({
      path,
      moduleId: moduleDeps[path].moduleId,
    });
  }

  // 写入 style.css
  fs.writeFileSync(`${distPath}/style.css`, cssMergeCode);
}

/**
 * 编译单个 WXSS 文件
 * @param {Object} opts - {path, moduleId}
 * @returns {Promise<string>} 编译后的 CSS 代码
 */
async function getCompileCssCode(opts) {
  const { path, moduleId } = opts;
  const workPath = getWorkPath();
  const wxssFileFullPath = `${workPath}/${path}.wxss`;

  // 读取 WXSS 文件
  const wxssCode = fs.readFileSync(wxssFileFullPath, 'utf8');

  // 使用 PostCSS 解析
  const ast = postcss.parse(wxssCode);

  // 1. rpx → rem 单位转换
  ast.walk((node) => {
    if (node.type === 'rule') {
      node.walkDecls((decl) => {
        decl.value = decl.value.replace(/rpx/g, 'rem');
      });
    }
  });

  const tranUnitCode = ast.toResult().css;

  // 2. 添加 scopeId + autoprefixer
  const result = await transCode(tranUnitCode, moduleId);

  return result;
}

/**
 * PostCSS 处理：添加 scopeId 和浏览器前缀
 * @param {string} cssCode - CSS 代码
 * @param {string} moduleId - 模块 ID
 * @returns {Promise<string>} 处理后的 CSS
 */
function transCode(cssCode, moduleId) {
  return new Promise((resolve) => {
    postcss([
      addScopeId({ moduleId }), // 自定义插件：添加 scopeId
      autoprefixer({ overrideBrowserslist: ['cover 99.5%'] }), // 浏览器前缀
    ])
      .process(cssCode, { from: undefined })
      .then((result) => {
        resolve(result.css + '\n');
      });
  });
}

/**
 * PostCSS 插件：为选择器添加 scopeId 属性选择器
 * 实现 scoped CSS 效果
 *
 * 示例：
 * .container → .container[data-v-abc123]
 *
 * @param {Object} opts - {moduleId}
 * @returns {Object} PostCSS 插件
 */
function addScopeId(opts) {
  const { moduleId } = opts;

  function func() {
    return {
      postcssPlugin: 'addScopeId',
      prepare() {
        return {
          OnceExit(root) {
            root.walkRules((rule) => {
              // 全局样式（app.wxss）不加 scopeId
              if (!moduleId) {
                return;
              }

              // 为每个选择器添加属性选择器
              rule.selector += `[data-v-${moduleId}]`;
            });
          },
        };
      },
    };
  }

  func.postcss = true;
  return func;
}

module.exports = {
  compileWxss,
};
