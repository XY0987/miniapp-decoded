import template from './template.html';
import './style.scss';
import { componentProxy } from '@/proxy';

componentProxy('ui-view', {
	template,

	methods: {
		clicked() {
			this.$emit('tap');
		}
	}
});