import message from '@/message';
import loader from '@/loader';
import runtimeManager from '@/runtimeManager';

class MessageManager {
	constructor() {
		this.message = message;
	}

	init() {
		this.message.receive('loadResource', (msg) => {
			const { appId } = msg;

			loader.loadResources({
				appId
			});
		});

		this.message.receive('updateModule', (msg) => {
			const { id, data } = msg;

			runtimeManager.updateModule({
				id,
				data
			});
		});

		this.message.receive('setInitialData', (msg) => {
			const { bridgeId, pagePath } = msg;
			
			loader.setInitialData(msg.initialData);
			runtimeManager.firstRender({
				pagePath,
				bridgeId
			});
		});
	}
}

export default new MessageManager();