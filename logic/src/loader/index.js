import message from '@/message';
import { AppModule } from './AppModule';
import { PageModule } from './PageModule';

// 小程序业务代码（app.js / pages/**/*.js 编译合并出来的 logic.js）
// 是由 native 容器在跑时下发给 JSCore 的。真机上这一步是客户端下载完资源包
// 后交给 JSCore 加载；在这个 demo 里我们是从 native 包暴露的 /mini_resource
// 静态目录里通过 importScripts 拉取。
const DEFAULT_APP_RESOURCE_BASE = 'http://127.0.0.1:3077/mini_resource';

class Loader {
	constructor() {
		this.staticModules = {};
	}

	loadResources(opts) {
		const { appId, bridgeId, resourceBase } = opts;
		const base = resourceBase || DEFAULT_APP_RESOURCE_BASE;
		const logicResourcePath = `${base}/${appId}/logic.js`;

		importScripts(logicResourcePath);
		message.send({
			type: 'logicResuorceLoaded',
			body: {
				bridgeId
			}
		});
	}

	getModuleByPath(path) {
		return this.staticModules[path];
	}

	createAppModule(moduleInfo) {
		const appModule = new AppModule(moduleInfo);

		this.staticModules.app = appModule;
	}

	createPageModule(moduleInfo, compileInfo) {
		const pageModule = new PageModule(moduleInfo, compileInfo);
		const { path } = compileInfo;

		this.staticModules[path] = pageModule;
	}

	getInitialDataByPagePath(pagePath) {
		const pageModule = this.staticModules[pagePath];

		return {
			[pagePath]: pageModule.getInitialData()
		};
	}
}

export default new Loader();