import { isFunction } from 'lodash';

const lifecycleMethods = ['onLaunch', 'onShow', 'onHide'];

class App {
	constructor(moduleInfo, openInfo) {
		this.moduleInfo = moduleInfo;
		this.openInfo = openInfo;
		this.init();
	}

	init() {
		this.initLifecycle();
		this.callLifecycle();
	}

	initLifecycle() {
		lifecycleMethods.forEach((name) => {
			if (!isFunction(this.moduleInfo[name])) {
				return;
			}

			this[name] = this.moduleInfo[name].bind(this);
		});
	}

	callLifecycle() {
		const { scene, pagePath, query } = this.openInfo;
		const options = {
			scene,
			query,
			path: pagePath
		};

		this.onLaunch(options);
		this.onShow(options);
	}

	callShowLifecycle() {
		const { scene, pagePath, query } = this.openInfo;
		const options = {
			scene,
			query,
			path: pagePath
		};

		this.onShow(options);
	}
}

export { App };