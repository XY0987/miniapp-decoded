const fs = require('fs');
const { getTargetPath } = require('../../env');

function writeFile(compileResult) {
	let mergeCode = '';
	const distPath = getTargetPath();

	compileResult.forEach((compileInfo) => {
		const { code, moduleId } = compileInfo;
		const amdCode = `
			modDefine('${moduleId}', function(require, module, exports) {
				${code}
			});
		`;

		mergeCode += amdCode;
	});
	fs.writeFileSync(`${distPath}/logic.js`, mergeCode);
}

module.exports = {
	writeFile
};