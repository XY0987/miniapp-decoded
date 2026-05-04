import { cloneDeep, isFunction } from 'lodash';
import message from '@/message';

const lifecycleMethods = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPageScroll'];

export class Page {
	constructor(pageModule, extraOption) {
		this.pageModule = pageModule;
		this.extraOption = extraOption;
		this.id = extraOption.id;
		this.data = cloneDeep(pageModule.moduleInfo.data);
		this.initLifecycle();
		this.initMethods();
		this.onLoad(this.extraOption.query || {});
		this.onShow();
	}	

	initLifecycle() {
		lifecycleMethods.forEach((name) => {
			if (!isFunction(this.pageModule.moduleInfo[name])) {
				return;
			}

			this[name] = this.pageModule.moduleInfo[name].bind(this);
		});
	}

	initMethods() {
		const moduleInfo = this.pageModule.moduleInfo;

		for (let attr in moduleInfo) {
			if (isFunction(moduleInfo[attr]) && !lifecycleMethods.includes(attr)) {
				this[attr] = moduleInfo[attr].bind(this);
			}
		}
	}

	setData(data) {
		for (let key in data) {
			this.data[key] = data[key];
		}

		message.send({
			type: 'updateModule',
			body: {
				id: this.id,
				data: this.data,
				bridgeId: this.id
			}
		});
	}
}