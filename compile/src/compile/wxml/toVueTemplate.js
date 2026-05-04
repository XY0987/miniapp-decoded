// <ui-view class="home" bindtap="viewTap">
//   {{text}}
// </view>

const { parseHTML } = require('../../toolkit/parseHTML');
const { makeTagStart, makeTagEnd } = require('./tag');

function toVueTemplate(wxmlContent) {
	const list = [];

	parseHTML(wxmlContent, {
		start(tag, attrs) {
			const tagStart = makeTagStart({
				tag,
				attrs
			});

			list.push(tagStart);
		},

		chars(str) {
			list.push(str.trim());
		},

		end(tag) {
			const tagEnd = makeTagEnd(tag);

			list.push(tagEnd);
		}
	});

	return list.join('');
}

module.exports = {
	toVueTemplate
};