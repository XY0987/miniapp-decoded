const { getAppConfigInfo, getWorkPath } = require('../../env');
const { buildByPagePath, buildByFullPath } = require('./buildByPagePath');
const { writeFile } = require('./writeFile');

function compileJS() {
	const { pages } = getAppConfigInfo();
	const workPath = getWorkPath();
	const appjsPath = `${workPath}/app.js`;
	const compileResult = [];

	pages.forEach((pagePath) => {
		buildByPagePath(pagePath, compileResult);
	});
	buildByFullPath(appjsPath, compileResult);
	writeFile(compileResult);
}

module.exports = {
	compileJS
};