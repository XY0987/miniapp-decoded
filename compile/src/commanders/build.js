const { saveEnvInfo } = require('../env');
const { createDist } = require('../toolkit/createDist');
const { compileJson } = require('../compile/json');
const { getModuleDeps } = require('../toolkit/getModuleDeps');
const { compileWxml } = require('../compile/wxml');
const { compileJS } = require('../compile/js');
const { compileWxss } = require('../compile/wxss');

function build(publishPath) {
	// 保存编译环境信息
	saveEnvInfo();

	// 创建dist文件夹
	createDist();

	// 编译配置配置文件
	compileJson();

	const moduleDeps = getModuleDeps();

	// 模板编译
	compileWxml(moduleDeps);

	// js编译
	compileJS();

	// wxss编译
	compileWxss(moduleDeps);
}

module.exports = {
	build
};