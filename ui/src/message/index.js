import mitt from 'mitt';

class Message {
	constructor() {
		this.event = mitt();
		this.init();
	}

	init() {
		window.JSBridge.onReceiveNativeMessage = (msg) => {
			const { type, body } = msg;

			this.event.emit(type, body);
		}
	}

	receive(type, callback) {
		this.event.on(type, callback);
	}

	send(msg) {
		window.JSBridge.onReceiveUIMessage(msg);
	}
}

export default new Message();