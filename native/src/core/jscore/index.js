import mitt from 'mitt';

// 逻辑线程的 JSCore 沙箱：
//   - 在真机上，小程序逻辑线程运行在 iOS 的 JavaScriptCore 或 Android 的 V8 里，
//     是一个没有 DOM/BOM 的纯 JS 沙箱。
//   - 在 Web 里最贴近"JSCore 沙箱"的就是 Web Worker：独立的 JS 执行上下文、
//     没有 window/document、只能通过 postMessage 和外界通信。
//   - 所以这里我们把 logic_sdk 编译出来的 core.js 拉下来，塞到一个 Blob Worker 里执行。
//
// 资源来源：logic 包启动后在 http://127.0.0.1:3100/logic/core.js 提供 SDK。
const LOGIC_SDK_URL =
	(typeof window !== 'undefined' && window.__LOGIC_SDK_URL__) ||
	'http://127.0.0.1:3100/logic/core.js';

export class JSCore {
	constructor() {
		this.parent = null;
		this.worker = null;
		this.event = mitt();
	}

	async init() {
		// 不能直接 new Worker(外域 URL) —— 浏览器同源策略，所以用 Blob 中转
		const jsContent = await fetch(LOGIC_SDK_URL);
		const codeString = await jsContent.text();
		const jsBlob = new Blob([codeString], {
			type: 'application/javascript'
		});
		const urlObj = window.URL.createObjectURL(jsBlob);

		this.worker = new Worker(urlObj);
		this.worker.addEventListener('message', (e) => {
			const msg = e.data;

			this.event.emit('message', msg);
		});
	}

	addEventListener(type, handler) {
		this.event.on(type, handler);
	}

	postMessage(msg) {
		this.worker.postMessage(msg);
	}
}