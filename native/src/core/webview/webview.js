import mitt from 'mitt';
import './style.scss';
import tpl from './tpl.html';
import { uuid } from '@native/utils/util';

// 原生层渲染
export class WebView {
	constructor(opts) {
		this.opts = opts;
		this.id = `webview_${uuid()}`;
		this.el = document.createElement('div');
		this.el.classList.add('wx-native-view');
		this.el.innerHTML = tpl;
		this.setInitialStyle();
		this.iframe = this.el.querySelector('.wx-native-webview__window');
		this.iframe.name = this.id;
		this.event = mitt();
	}

	async init(callback) {
		await this.frameLoaded();
		const iframeWindow = window.frames[this.iframe.name];

		iframeWindow.JSBridge.onReceiveUIMessage = (msg) => {
			this.event.emit('message', msg);
		};
		callback && callback();
	}

	addEventListener(type, handler) {
		this.event.on(type, handler);
	}

	postMessage(msg) {
		const iframeWindow = window.frames[this.iframe.name];

		iframeWindow.JSBridge.onReceiveNativeMessage(msg);
	}

	frameLoaded() {
		return new Promise((resolve) => {
			this.iframe.onload = () => {
				resolve();
			}
		});
	}

	setInitialStyle() {
		const config = this.opts.configInfo;
		const webview = this.el.querySelector('.wx-native-webview');
		const pageName = this.el.querySelector('.wx-native-webview__navigation-title');
		const navigationBar = this.el.querySelector('.wx-native-webview__navigation');
		const leftBtn = this.el.querySelector('.wx-native-webview__navigation-left-btn');
		const root = this.el.querySelector('.wx-native-webview__root');

		if (this.opts.isRoot) {
			leftBtn.style.display = 'none';
		}
		else {
			leftBtn.style.display = 'block';
		}

		if (config.navigationBarTextStyle === 'white') {
			navigationBar.classList.add('wx-native-webview__navigation--white');
		}
		else {
			navigationBar.classList.add('wx-native-webview__navigation--black');
		}

		if (config.navigationStyle === 'custom') {
			webview.classList.add('wx-native-webview--custom-nav');
		}

		root.style.backgroundColor = config.backgroundColor;
		navigationBar.style.backgroundColor = config.navigationBarBackgroundColor;
		pageName.innerText = config.navigationBarTitleText;
	}
}