import { uuid } from '@/utils/util';
import loader from '@/loader';
import message from '@/message';

class RuntimeManager {
	constructor() {
		this.page = null;
		this.pageId = '';
		this.uiInstance = {};
	}

	firstRender(opts) {
		const { pagePath, bridgeId } = opts;
		const options = this.makeVueOptions({
			path: pagePath,
			bridgeId
		});
		const root = document.querySelector('#root');

		this.pageId = bridgeId;
		this.page = new Vue(options).$mount();
		root.appendChild(this.page.$el);
		root.addEventListener('scroll', function() {
			message.send({
				type: 'pageScroll',
				body: {
					scrollTop: root.scrollTop,
					id: bridgeId
				}
			});
		}, false);
	}

	updateModule(opts) {
		const { id, data } = opts;
		const viewModule = this.uiInstance[id];

		for (let key in data) {
			Vue.set(viewModule, key, data[key]);
		}
	}

	makeVueOptions(opts) {
		const { path, bridgeId } = opts;
		const staticModule = loader.getModuleByPath(path);
		const self = this;

		return {
			data() {
				return {
					...staticModule.data
				};
			},

			beforeCreate() {
				this._bridgeInfo = {
					id: self.pageId
				};
			},

			created() {
				self.uiInstance[self.pageId] = this;
				message.send({
					type: 'moduleCreated',
					body: {
						id: self.pageId,
						path,
					}
				});
			},

			mounted() {
				message.send({
					type: 'moduleMounted',
					body: {
						id: self.pageId,
					}
				});
			},

			render: staticModule.moduleInfo.render,
		};
	}
}

export default new RuntimeManager();