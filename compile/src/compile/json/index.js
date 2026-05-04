const fs = require('fs');
const { getAppConfigInfo, getModuleConfigInfo, getTargetPath } = require('../../env');

function compileJson() {
	const distPath = getTargetPath();
	const compileResultInfo = {
		app: getAppConfigInfo(),
		modules: getModuleConfigInfo()
	};
	const jsonStr = JSON.stringify(compileResultInfo, null, 4);

	fs.writeFileSync(`${distPath}/config.json`, jsonStr);
}

module.exports = {
	compileJson
};