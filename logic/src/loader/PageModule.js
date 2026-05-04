export class PageModule {
	constructor(moduleInfo, compileInfo) {
		this.type = 'page';
		this.moduleInfo = moduleInfo;
		this.compileInfo = compileInfo;
	}

	getInitialData() {
		const moduleData = this.moduleInfo.data || {};

		return {
			...moduleData
		};
	}
}