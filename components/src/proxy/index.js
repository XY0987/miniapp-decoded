export function componentProxy(name, opts) {
	opts.mixins = [{
		created() {
			for (let attr in this.$attrs) {
				if (!/^bind/.test(attr)) {
					continue;
				}

				if (!this.$attrs[attr]) {
					continue;
				}

				const eventName = attr.replace(/^bind/, '');
				const methodName = this.$attrs[attr];
				const { id } = this.$vnode.context._bridgeInfo;

				this.$on(eventName, () => {
					window.JSBridge.onReceiveUIMessage({
						type: 'trrigerEvent',
						body: {
							methodName,
							id
						}
					});
					console.log('事件被触发');
				});
			}
		}
	}];

	Vue.component(name, opts);
}