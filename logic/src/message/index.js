import mitt from 'mitt';

class Message {
	constructor() {
		this.event = mitt();
		this.init();
	}

	init() {
		global.addEventListener('message', (e) => {
			const msg = e.data;
			const { type, body } = msg;

			this.event.emit(type, body);
		});
	}

	receive(type, callback) {
		this.event.on(type, callback);
	}

	send(msg) {
		global.postMessage(msg);
	}
}

export default new Message();