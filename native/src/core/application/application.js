import './application.scss';
import { uuid, sleep } from '@native/utils/util';

export class Application {
	constructor() {
		this.el = null;
		this.window = null;
		this.views = [];
		this.rootView = null;
		this.parent = null;
		this.done = true;
		this.init();
	}

	init() {
		this.el = document.createElement('div');
		this.el.classList.add('wx-application');
		this.window = document.createElement('div');
		this.window.classList.add('wx-native-window');
		this.el.appendChild(this.window);
	}

	initRootView(view) {
		this.rootView = view;
		view.parent = this;
		view.el.classList.add('wx-native-view--instage');
		view.el.style.zIndex = 1;
		this.views.push(view);
		this.window.appendChild(view.el);
		view.viewDidLoad && view.viewDidLoad();
	}

	async pushView(view) {
		// 防抖
		if (!this.done) {
			return;
		}
		this.done = false;

		// 在视图栈里找到上一个视图
		const preView = this.views[this.views.length - 1];

		// 当前视图入栈
		view.parent = this;
		this.views.push(view);
		view.el.style.zIndex = this.views.length;
		view.el.classList.add('wx-native-view--before-enter');
		this.window.appendChild(view.el);
		view.viewDidLoad && view.viewDidLoad();
		await sleep(1);

		// 上一个视图向左动画推出
		preView.el.classList.remove('wx-native-view--instage');
		preView.el.classList.add('wx-native-view--slide-out');
		preView.el.classList.add('wx-native-view--linear-anima');

		// 当前视图向左动画推入
		view.el.classList.add('wx-native-view--enter-anima');
		view.el.classList.add('wx-native-view--instage');
		await sleep(540);
		this.done = true;

		// 动画结束之后移出相关class
		preView.el.classList.remove('wx-native-view--linear-anima');
		view.el.classList.remove('wx-native-view--before-enter');
		view.el.classList.remove('wx-native-view--enter-anima');
		view.el.classList.remove('wx-native-view--instage');
	}

	async popView() {
		if (this.views.length < 2) {
			return;
		}

		if (!this.done) {
			return;
		}

		this.done = false;

		const preView = this.views[this.views.length - 2];
		const currentView = this.views[this.views.length - 1]

		preView.el.classList.remove('wx-native-view--slide-out');
		preView.el.classList.add('wx-native-view--instage');
		preView.el.classList.add('wx-native-view--enter-anima');

		currentView.el.classList.remove('wx-native-view--instage');
		currentView.el.classList.add('wx-native-view--before-enter');
		currentView.el.classList.add('wx-native-view--enter-anima');

		await sleep(540);
		this.done = true;
		this.views.pop();
		this.window.removeChild(currentView.el);
		preView.el.classList.remove('wx-native-view--enter-anima');
	}

	async presentView(view, useCache) {
		if (!this.done) {
			return;
		}
		this.done = false;

		const preView = this.views[this.views.length - 1];

		view.parent = this;
		view.el.style.zIndex = this.views.length + 1;
		view.el.classList.add('wx-native-view--before-present');
		view.el.classList.add('wx-native-view--enter-anima');
		preView.el.classList.add('wx-native-view--before-presenting');
		preView.el.classList.remove('wx-native-view--instage');
		preView.el.classList.add('wx-native-view--enter-anima');
		preView.onPresentOut && preView.onPresentOut();
		view.onPresentIn && view.onPresentIn();
		!useCache && this.el.appendChild(view.el);
		this.views.push(view);
		!useCache && view.viewDidLoad && view.viewDidLoad();
		await sleep(20);
		preView.el.classList.add('wx-native-view--presenting');
		view.el.classList.add('wx-native-view--instage');
		await sleep(540);
		this.done = true;
		view.el.classList.remove('wx-native-view--before-present');
		view.el.classList.remove('wx-native-view--enter-anima');
		preView.el.classList.remove('wx-native-view--enter-anima');
		preView.el.classList.remove('wx-native-view--before-presenting');
	}

	async dismissView(opts = {}) {
		if (!this.done) {
			return;
		}
		this.done = false;

		const preView = this.views[this.views.length - 2];
		const currentView = this.views[this.views.length - 1];
		const { destroy = true } = opts;

		currentView.el.classList.add('wx-native-view--enter-anima');
		preView.el.classList.add('wx-native-view--enter-anima');
		preView.el.classList.add('wx-native-view--before-presenting');
		await sleep(0);
		currentView.el.classList.add('wx-native-view--before-present');
		currentView.el.classList.remove('wx-native-view--instage');
		preView.el.classList.remove('wx-native-view--presenting');

		preView.onPresentIn && preView.onPresentIn();
		currentView.onPresentOut && currentView.onPresentOut();
		
		await sleep(540);
		this.done = true;
		destroy && this.el.removeChild(currentView.el);
		this.views.pop();
		preView.el.classList.remove('wx-native-view--enter-anima');
		preView.el.classList.remove('wx-native-view--before-presenting');
	}

	updateStatusBarColor(color) {
		this.parent.updateDeviceBarColor && this.parent.updateDeviceBarColor(color);
	}
}

