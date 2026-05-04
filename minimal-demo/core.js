const global = this;

// 接收来自native的消息
this.addEventListener('message', (e) => {
	console.log('jscore收到消息:', e.data);
	page[e.data]();
});

// 模拟小程序页面代码
const page = {
	data: {
		text: '我是来自逻辑线程的数据'
	},

	updateData: function() {
		console.log('调用updateData');
		this.data.text += '!!!';
		global.postMessage(page.data.text);
	}
};

function initPage() {
	global.postMessage(page.data.text);
};

initPage();