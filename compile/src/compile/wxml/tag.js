const tagWhiteList = ['view'];

function makeTagStart(opts) {
	const { tag, attrs } = opts;

	if (!tagWhiteList.includes(tag)) {
		throw `${tag}组件不支持`;
	}

	const transTag = `ui-${tag}`;
	const propsStr = getPropsStr(attrs);

	if (attrs.length) {
		return `<${transTag} ${propsStr}>`;
	}

	return `<${transTag}>`;
}

function makeTagEnd(tag) {
	return `</ui-${tag}>`;
}

function getPropsStr(attrs) {
	const attrsList = [];

	attrs.forEach((attrInfo) => {
		const { name, value } = attrInfo;

		// bind* / catch* 这类事件绑定属性，不走 Vue 的事件系统，
		// 而是作为普通 attribute 透传给 <ui-*> 组件，由 components/proxy 里的 mixin 在
		// created 钩子里读取 this.$attrs 并转成 $on(...) 监听，最终把事件跨线程发到逻辑层。
		attrsList.push({
			name,
			value
		});
	});

	return linkAttrs(attrsList);
}

function linkAttrs(attrsList) {
	const result = [];

	attrsList.forEach((attrInfo) => {
		const { name, value } = attrInfo;

		result.push(`${name}="${value}"`);
	});

	return result.join(' ');
}

module.exports = {
	makeTagStart,
	makeTagEnd
};