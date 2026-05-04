import loader from '@/loader';
import { App } from './App';
import { Page } from './Page';

class RuntimeManager {
	constructor() {
		this.app = null;
		this.pages = {};
	}

	createApp(opts) {
		const { scene, pagePath, query } = opts;
		const appModuleInfo = loader.staticModules.app.moduleInfo;

		this.app = new App(appModuleInfo, {
			scene,
			pagePath,
			query
		});
	}

	createPage(opts) {
		const { id, path, bridgeId, query } = opts;
		const staticModule = loader.getModuleByPath(path);

		this.pages[id] = new Page(staticModule, {
			id,
			bridgeId,
			path,
			query
		});
		console.log('this.pages[id]:', this.pages[id]);
	}

	appShow() {
		this.app.callShowLifecycle();
	}

	appHide() {
		this.app.onHide();
	}

	pageShow(opts) {
		const { id } = opts;
		const page = this.pages[id];

		page.onShow && page.onShow();
	}

	pageHide(opts) {
		const { id } = opts;
		const page = this.pages[id];

		page.onHide && page.onHide();
	}

	pageReady(opts) {
		const { id } = opts;
		const page = this.pages[id];

		page.onReady && page.onReady();
	}

	pageScroll(opts) {
		const { id, scrollTop } = opts;
		const page = this.pages[id];

		page.onPageScroll && page.onPageScroll({
			scrollTop
		});
	}

	trrigerEvent(opts) {
		const { id, methodName } = opts;
		const page = this.pages[id];

		page[methodName] && page[methodName]();
	}
}

export default new RuntimeManager();