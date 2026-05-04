import loader from '@/loader';

class GlobalApi {
	constructor() {

	}

	init() {
		global.App = (moduleInfo) => {
			loader.createAppModule(moduleInfo);
		}

		global.Page = (moduleInfo, compileInfo) => {
			loader.createPageModule(moduleInfo, compileInfo);
		}
	}
}

export default new GlobalApi();