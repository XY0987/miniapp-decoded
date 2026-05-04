const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const { getWorkPath } = require('../../env');
const { walkAst } = require('./walkAst');

function buildByPagePath(pagePath, compileResult) {
	const workPath = getWorkPath();
	const pageFullPath = `${workPath}/${pagePath}.js`;

	buildByFullPath(pageFullPath, compileResult);
}

function buildByFullPath(filePath, compileResult) {
	if (hasCompileInfo(filePath, compileResult)) {
		return;
	}

	const jscode = fs.readFileSync(filePath, 'utf8');
	const ast = babel.parseSync(jscode);
	const moduleId = getModuleId(filePath);
	const compileInfo = {
		filePath,
		code: '',
		moduleId
	};

	walkAst(ast, {
		CallExpression(node) {
			if (node.callee.name === 'Page') {
				node.arguments.push({
					type: 'ObjectExpression',
				  properties: [
				    {
				      type: 'ObjectProperty',
				      method: false,
				      key: {
				        type: 'Identifier',
				        name: 'path'
				      },
				      computed: false,
				      shorthand: false,
				      value: {
				        type: 'StringLiteral',
				        extra: {
				          rawValue: `'${moduleId}'`,
				          raw: `'${moduleId}'`,
				        },
				        value: `'${moduleId}'`,
				      }
				    }
				  ]
				});
			}

			if (node.callee.name === 'require') {
				const requirePath = node.arguments[0].value;
				const requireFullPath = path.resolve(filePath, `../${requirePath}`);
				const moduleId = getModuleId(requireFullPath);

				node.arguments[0].value = `'${moduleId}'`;
	  		node.arguments[0].extra.rawValue = `'${moduleId}'`;
	  		node.arguments[0].extra.raw = `'${moduleId}'`;
	  		buildByFullPath(requireFullPath, compileResult);
			}
		}
	});

	const { code: codeTrans } = babel.transformFromAstSync(ast, '', {});

	compileInfo.code = codeTrans;
	compileResult.push(compileInfo);
}

function getModuleId(fullPath) {
	const workPath = getWorkPath();
	const after = fullPath.split(`${workPath}/`)[1];

	return after.split('.js')[0];
}

function hasCompileInfo(filePath, list) {
	for (let i = 0; i < list.length; i++) {
		if (list[i].filePath === filePath) {
			return true;
		}
	}

	return false;
}

module.exports = {
	buildByPagePath,
	buildByFullPath
};