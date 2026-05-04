import './home.scss';
import tpl from './Home.html';
import { uuid } from '@native/utils/util';
import { MiniAppList } from '@native/pages/miniAppList/miniAppList';

export class Home {
	constructor() {
		this.id = `ui_view${uuid()}`;
		this.parent = null;
		this.el = document.createElement('div');
		this.el.classList.add('wx-native-view');
	}

	viewDidLoad() {
		this.el.innerHTML = tpl;
		this.bindEvent();
	}

	bindEvent() {
		const btn = this.el.querySelector('.weixin-app__miniprogram-entry');

		btn.onclick = () => {
			this.jumpToMiniAppListPage();
		};
	}

	jumpToMiniAppListPage() {
		const appListPage = new MiniAppList();

		this.parent.pushView(appListPage);
	}
}
