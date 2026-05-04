import './style.scss';
import tpl from './tpl.html';
import { uuid, sleep } from '@native/utils/util';
import { AppManager } from '@native/core/appManager/appManager';
import { Bridge } from '@native/core/bridge';
import { JSCore } from '@native/core/jscore';
import { readFile, mergePageConfig } from './util';

export class MiniAppSandbox {
	constructor(opts) {
		this.appInfo = opts;
		this.id = `ui_view${uuid()}`;
		this.parent = null;
		this.appId = opts.appId;
		this.appConfig = null;
		this.bridgeList = [];
		this.jscore = new JSCore();
		this.jscore.parent = this;
		this.webviewsContainer = null;
		this.el = document.createElement('div');
		this.el.classList.add('wx-native-view');
		this.jscore.addEventListener('message', this.jscoreMessageHandler.bind(this));
	}

	viewDidLoad() {
		this.initPageFrame();
		this.webviewsContainer = this.el.querySelector('.wx-mini-app__webviews');
		this.showLaunchScreen();
		this.bindCloseEvent();
		this.initApp();
	}

	async initApp() {
		await this.jscore.init();

		// 1. 模拟拉取小程序资源
		await sleep(1000);

		// 2. 读取配置文件
		const configPath = `${this.appInfo.appId}/config.json`;
		const configContent = await readFile(configPath);

		this.appConfig = JSON.parse(configContent);
		
		// 3. 设置状态栏的颜色模式
		const entryPagePath = this.appInfo.pagePath || this.appConfig.app.entryPagePath;

		this.updateTargetPageColorStyle(entryPagePath);

		// 4. 创建通信桥 bridge
		const pageConfig = this.appConfig.modules[entryPagePath];
		const entryPageBridge = await this.createBridge({
			pagePath: entryPagePath,
			query: this.appInfo.query,
			scene: this.appInfo.scene,
			jscore: this.jscore,
			isRoot: true,
			appId: this.appInfo.appId,
			configInfo: mergePageConfig(this.appConfig.app, pageConfig)
		});

		this.bridgeList.push(entryPageBridge);
		entryPageBridge.start();

		// 5. 触发应用的初始化逻辑
		this.hideLaunchScreen();
	}

	// 创建一个bridge对象
	async createBridge(opts) {
		const { jscore, configInfo, isRoot, appId, pagePath, query, scene } = opts;
		const bridge = new Bridge({
			jscore,
			configInfo,
			isRoot,
			appId,
			pagePath,
			query,
			scene
		});

		bridge.parent = this;
		await bridge.init();
		return bridge;
	}

	onPresentIn() {
		const currentBridge = this.bridgeList[this.bridgeList.length - 1];

		currentBridge && currentBridge.appShow();
		currentBridge && currentBridge.pageShow();
	}

	onPresentOut() {
		const currentBridge = this.bridgeList[this.bridgeList.length - 1];

		currentBridge && currentBridge.appHide();
		currentBridge && currentBridge.pageHide();
	}

	initPageFrame() {
		this.el.innerHTML = tpl;
	}

	// 设置指定页面状态栏的颜色模式
	updateTargetPageColorStyle(pagePath) {
		const pageConfig = this.appConfig.modules[pagePath];
		const mergeConfig = mergePageConfig(this.appConfig.app, pageConfig);
		const { navigationBarTextStyle } = mergeConfig;

		this.updateActionColorStyle(navigationBarTextStyle);
	}

	showLaunchScreen() {
		const launchScreen = this.el.querySelector('.wx-mini-app__launch-screen');
		const name = this.el.querySelector('.wx-mini-app__name');
		const logo = this.el.querySelector('.wx-mini-app__logo-img-url');

		this.updateActionColorStyle('black');
		name.innerHTML = this.appInfo.appName;
		logo.src = this.appInfo.logo;
		launchScreen.style.display = 'block';
	}

	hideLaunchScreen() {
		const startPage = this.el.querySelector('.wx-mini-app__launch-screen');

		startPage.style.display = 'none';
	}

	updateActionColorStyle(color) {
		const action = this.el.querySelector('.wx-mini-app-navigation__actions');

		if (color === 'white') {
			action.classList.remove('wx-mini-app-navigation__actions--black');
			action.classList.add('wx-mini-app-navigation__actions--white');
		}

		if (color === 'black') {
			action.classList.remove('wx-mini-app-navigation__actions--white');
			action.classList.add('wx-mini-app-navigation__actions--black');
		}

		this.parent.updateStatusBarColor(color);
	}

	jscoreMessageHandler(msg) {
		
	}

	bindCloseEvent() {
		const closeBtn = this.el.querySelector('.wx-mini-app-navigation__actions-close');

		closeBtn.onclick = () => {
			AppManager.closeApp(this);
		};
	}
}