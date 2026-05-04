import { uuid } from '@native/utils/util';
import { WebView } from '@native/core/webview/webview';

// 通信桥
export class Bridge {
	constructor(opts) {
		this.id = `bridge_${uuid()}`;
		this.opts = opts;
		this.webview = null;
		this.jscore = opts.jscore;
		this.parent = null;
		this.status = 0;
		this.jscore.addEventListener('message', this.jscoreMessageHandler.bind(this));
	}

	jscoreMessageHandler(msg) {
		const { type, body } = msg;

		if (body.bridgeId !== this.id) {
			return;
		}

		switch(type) {
			case 'logicResuorceLoaded':
				this.status++;
				this.createApp();
				break;

			case 'appIsCreated':
				this.status++;
				this.notifyMakeInitialData();
				break;

			case 'initialDataIsReady':
				this.status++;
				this.setInitialData(msg);
				break;

			case 'updateModule':
				this.updateModule(body);
				break;
		}
	}

	uiMessageHandler(msg) {
		const { type } = msg;

		switch(type) {
			case 'uiResourceLoaded':
				this.status++;
				this.createApp();
				break;

			case 'moduleCreated':
				this.uiInstanceCreated(msg.body);
				break;

			case 'moduleMounted':
				this.uiInstanceMounted(msg.body);
				break;

			case 'pageScroll':
				this.pageScroll(msg.body);
				break;

			case 'trrigerEvent':
				this.trrigerEvent(msg.body);
				break;
		}
	}

	trrigerEvent(msg) {
		const { id, methodName } = msg;

		this.jscore.postMessage({
			type: 'trrigerEvent',
			body: {
				id,
				methodName
			}
		});
	}

	pageScroll(msg) {
		const { id, scrollTop } = msg;

		this.jscore.postMessage({
			type: 'pageScroll',
			body: {
				id,
				scrollTop
			}
		});
	}

	uiInstanceMounted(msg) {
		const { id } = msg;

		this.jscore.postMessage({
			type: 'moduleMounted',
			body: {
				id
			}
		});
	}

	notifyMakeInitialData() {
		this.jscore.postMessage({
			type: 'makePageInitialData',
			body: {
				bridgeId: this.id,
				pagePath: this.opts.pagePath
			}
		});
	}

	appShow() {
		if (this.status < 2) {
			return;
		}

		this.jscore.postMessage({
			type: 'appShow',
			body: {}
		});
	}

	pageShow() {
		if (this.status < 2) {
			return;
		}

		this.jscore.postMessage({
			type: 'pageShow',
			body: {
				bridgeId: this.id
			}
		});
	}

	appHide() {
		if (this.status < 2) {
			return;
		}

		this.jscore.postMessage({
			type: 'appHide',
			body: {}
		});
	}

	pageHide() {
		if (this.status < 2) {
			return;
		}

		this.jscore.postMessage({
			type: 'pageHide',
			body: {
				bridgeId: this.id
			}
		});
	}

	start() {
		// 通知渲染线程加载资源
		this.webview.postMessage({
			type: 'loadResource',
			body: {
				appId: this.opts.appId,
			}
		});

		// 通知逻辑线程加载资源
		this.jscore.postMessage({
			type: 'loadResource',
			body: {
				appId: this.opts.appId,
				bridgeId: this.id,
			}
		});
	}

	updateModule(msg) {
		const { id, data } = msg;

		this.webview.postMessage({
			type: 'updateModule',
			body: {
				id,
				data
			}
		});
	}

	async init() {
		this.webview = await this.createWebview();
		this.webview.addEventListener('message', this.uiMessageHandler.bind(this));
	}

	createWebview() {
		return new Promise((resolve) => {
			const webview = new WebView({
				configInfo: this.opts.configInfo,
				isRoot: this.opts.isRoot
			});

			webview.parent = this;
			webview.init(() => {
				resolve(webview);
			});
			this.parent.webviewsContainer.appendChild(webview.el);
		});
	}

	setInitialData(msg) {
		const { initialData } = msg.body;

		this.webview.postMessage({
			type: 'setInitialData',
			body: {
				initialData,
				bridgeId: this.id,
				pagePath: this.opts.pagePath
			}
		});
	}

	uiInstanceCreated(msg) {
		const { id, path } = msg;

		this.jscore.postMessage({
			type: 'createInstance',
			body: {
				id,
				path,
				bridgeId: this.id,
				query: this.opts.query
			}
		});
	}

	createApp() {
		if (this.status !== 2) {
			return;
		}

		this.jscore.postMessage({
			type: 'createApp',
			body: {
				bridgeId: this.id,
				scene: this.opts.scene,
				pagePath: this.opts.pagePath,
				query: this.opts.query,
			}
		});
	}
}