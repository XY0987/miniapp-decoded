export class PageModule {
	constructor(moduleInfo) {
		this.type = 'page';
		this.data = {};
		this.moduleInfo = moduleInfo;
	}

	setInitialData(data) {
		this.data = data;
	}
}