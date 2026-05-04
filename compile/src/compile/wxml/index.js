const fs = require('fs');
const vueCompiler = require('vue-template-compiler');
const { compileTemplate } = require('@vue/component-compiler-utils');
const { getWorkPath } = require('../../env');
const { toVueTemplate } = require('./toVueTemplate');
const { writeFile } = require('./writeFile');

function compileWxml(moduleDeps) {
	const list = [];

	for (let path in moduleDeps) {
		const code = compile(path, moduleDeps[path].moduleId);

		list.push({
			code,
			path
		});
	}

	writeFile(list);
}

function compile(path, moduleId) {
	const workPath = getWorkPath();
	const wxmlFullPath = `${workPath}/${path}.wxml`;
	const wxmlContent = fs.readFileSync(wxmlFullPath, {encoding: 'utf8'});
	const vueTemplate = toVueTemplate(wxmlContent.trim());
	const compileResult = compileTemplate({
		source: vueTemplate,
		compiler: vueCompiler
	});
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
	compileWxml
};