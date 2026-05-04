const fs = require('fs');

const pathInfo = {};
const configInfo = {};

function saveEnvInfo() {
	savePathInfo();
	saveProjectConfig();
	saveAppConfig();
	saveModuleConfig();
}

function saveModuleConfig() {
	const { pages } = configInfo.appInfo;

	configInfo.moduleInfo = {};
	pages.forEach((path) => {
		const pageConfigFullPath = `${pathInfo.workPath}/${path}.json`;
		const jsonContent = getJsonContentByFullPath(pageConfigFullPath);

		configInfo.moduleInfo[path] = jsonContent;
	});
}

function getAppConfigInfo() {
	return configInfo.appInfo;
}

function getModuleConfigInfo() {
	return configInfo.moduleInfo;
}

function getTargetPath() {
	return pathInfo.targetPath;
}

function getWorkPath() {
	return pathInfo.workPath;
}

function savePathInfo() {
	pathInfo.workPath = process.cwd();
	pathInfo.targetPath = `${pathInfo.workPath}/dist`;
}

function saveProjectConfig() {
	const filePath = `${pathInfo.workPath}/project.config.json`;
	const jsonContent = getJsonContentByFullPath(filePath);

	configInfo.projectInfo = jsonContent;
}

function saveAppConfig() {
	const filePath = `${pathInfo.workPath}/app.json`;
	const jsonContent = getJsonContentByFullPath(filePath);

	configInfo.appInfo = jsonContent;
}

function getJsonContentByFullPath(path) {
	const jsonStr = fs.readFileSync(path, {encoding: 'utf8'});

	return JSON.parse(jsonStr);
}

module.exports = {
	saveEnvInfo,
	getTargetPath,
	getAppConfigInfo,
	getModuleConfigInfo,
	getWorkPath
};