import loader from '@/loader';

class GlobalApi {
	constructor() {

	}

	init() {
		window.Page = (moduleInfo) => {
			loader.createPageModule(moduleInfo);
		}
	}
}

export default new GlobalApi();