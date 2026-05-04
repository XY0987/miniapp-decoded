import message from '@/message';
import { PageModule } from './PageModule';

class Loader {
	constructor() {
		this.staticModules = {};
	}

	loadResources(opts) {
		const { appId } = opts;
		const viewResourcePath = `/mini_resource/${appId}/view.js`;
		const styleResourcePath = `/mini_resource/${appId}/style.css`;
		const script = document.createElement('script');
		const link = document.createElement('link');

		Promise.all([
			this.loadStyleFile(link, styleResourcePath),
			this.loadScriptFile(script, viewResourcePath),
		]).then(() => {
			message.send({
				type: 'uiResourceLoaded',
				body: {}
			});
		});
	}

	loadStyleFile(link, path) {
		return new Promise((resolve) => {
			link.rel = 'stylesheet';
			link.href = path;
			link.onload = () => {
				resolve();
			}
			document.body.appendChild(link);
		});
	}

	loadScriptFile(script, path) {
		return new Promise((resolve) => {
			script.src = path;
			script.onload = () => {
				resolve();
			}
			document.body.appendChild(script);
		});
	}

	createPageModule(moduleInfo) {
		const pageModule = new PageModule(moduleInfo);
		const { path } = moduleInfo;

		this.staticModules[path] = pageModule;
	}

	getModuleByPath(path) {
		return this.staticModules[path];
	}

	setInitialData(initialData) {
		for (let [path, data] of Object.entries(initialData)) {
			const staticModule = this.staticModules[path];

			if (!staticModule) {
				continue;
			}

			staticModule.setInitialData(data);
		}
	}
}

export default new Loader();