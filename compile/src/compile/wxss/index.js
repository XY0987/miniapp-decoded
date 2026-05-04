const fs = require('fs');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const { getWorkPath, getTargetPath } = require('../../env');

async function compileWxss(moduleDeps) {
	let cssMergeCode = await getCompileCssCode({
		path: 'app',
		moduleId: ''
	});
	const distPath = getTargetPath();

	for (const path in moduleDeps) {
		cssMergeCode += await getCompileCssCode({
			path,
			moduleId: moduleDeps[path].moduleId
		});
	}

	fs.writeFileSync(`${distPath}/style.css`, cssMergeCode);
}

async function getCompileCssCode(opts) {
	const { path, moduleId } = opts;
	const workPath = getWorkPath();
	const wxssFileFullPath = `${workPath}/${path}.wxss`;
	const wxssCode = fs.readFileSync(wxssFileFullPath, 'utf8');
	const ast = postcss.parse(wxssCode);

	ast.walk((node) => {
		if (node.type === 'rule') {
			node.walkDecls((decl) => {
				decl.value = decl.value.replace(/rpx/g, 'rem');
			});
		}
	});

	const tranUnitCode = ast.toResult().css;
	const result = await transCode(tranUnitCode, moduleId);

	return result;
}

function transCode(cssCode, moduleId) {
	return new Promise((resolve) => {
		postcss([
			addScopeId({moduleId}),
			autoprefixer({overrideBrowserslist: ['cover 99.5%']})
		])
		.process(cssCode, {from: undefined})
		.then((result) => {
			resolve(result.css + '\n');
		})
	});
}

function addScopeId(opts) {
	const { moduleId } = opts;

	function func() {
		return {
			postcssPlugin: 'addScopeId',
			prepare() {
				return {
					OnceExit(root) {
						root.walkRules((rule) => {
							if (!moduleId) {
								return;
							}

							rule.selector += `[data-v-${moduleId}]`;
						});
					}
				};
			}
		};
	}

	func.postcss = true;
	return func;
}

module.exports = {
	compileWxss
};