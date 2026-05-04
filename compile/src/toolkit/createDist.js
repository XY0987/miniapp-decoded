const shelljs = require('shelljs');
const { getTargetPath } = require('../env');

function createDist() {
	const distPath = getTargetPath();
	const hasDistFolder = shelljs.test('-d', distPath);

	if (hasDistFolder) {
		shelljs.rm('-rf', distPath);
	}

	shelljs.mkdir('-p', distPath);
}

module.exports = {
	createDist
};