const fs = require('fs');
const { getTargetPath } = require('../../env');

function writeFile(list) {
	let codeMere = '';
	const distPath = getTargetPath();

	list.forEach((compileInfo) => {
		const { code } = compileInfo;

		codeMere += code;
	});

	fs.writeFileSync(`${distPath}/view.js`, codeMere);
}

module.exports = {
	writeFile
}