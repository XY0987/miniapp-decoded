const { getAppConfigInfo } = require('../env');
const { uuid } = require('../utils/util');

function getModuleDeps() {
	const result = {};
	const { pages } = getAppConfigInfo();

	pages.forEach((pagePath) => {
		result[pagePath] = {
			path: pagePath,
			moduleId: uuid()
		};
	});

	return result;
}

module.exports = {
	getModuleDeps
};