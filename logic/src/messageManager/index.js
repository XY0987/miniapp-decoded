import loader from '@/loader';
import message from '@/message';
import runtimeManager from '@/runtimeManager';

class MessageManager {
	constructor() {
		this.message = message;
	}

	init() {
		this.message.receive('loadResource', (msg) => {
			const { appId, bridgeId } = msg;

			loader.loadResources({
				appId,
				bridgeId
			});
		});

		this.message.receive('createApp', (msg) => {
			const { bridgeId, scene, pagePath, query } = msg;

			runtimeManager.createApp({
				scene,
				pagePath,
				query
			});
			message.send({
				type: 'appIsCreated',
				body: {
					bridgeId
				}
			});
		});

		this.message.receive('appShow', () => {
			runtimeManager.appShow();
		});

		this.message.receive('appHide', () => {
			runtimeManager.appHide();
		});

		this.message.receive('pageShow', (msg) => {
			const { bridgeId } = msg;

			runtimeManager.pageShow({
				id: bridgeId
			});
		});

		this.message.receive('pageHide', (msg) => {
			const { bridgeId } = msg;

			runtimeManager.pageHide({
				id: bridgeId
			});
		});

		this.message.receive('trrigerEvent', (msg) => {
			const { id, methodName } = msg;

			runtimeManager.trrigerEvent({
				id,
				methodName
			});
		});

		this.message.receive('moduleMounted', (msg) => {
			const { id } = msg;

			runtimeManager.pageReady({
				id
			});
		});

		this.message.receive('pageScroll', (msg) => {
			const { id, scrollTop } = msg;

			runtimeManager.pageScroll({
				id,
				scrollTop
			});
		});

		this.message.receive('createInstance', (msg) => {
			const { id, path, bridgeId, query } = msg;

			runtimeManager.createPage({
				id,
				path,
				bridgeId,
				query
			});
		});

		this.message.receive('makePageInitialData', (msg) => {
			const { pagePath, bridgeId } = msg;
			const initialData = loader.getInitialDataByPagePath(pagePath);

			message.send({
				type: 'initialDataIsReady',
				body: {
					bridgeId,
					initialData
				}
			});
		});
	}
}

export default new MessageManager();