/**
 * @file Home 微信首页
 * @description 模拟微信聊天列表首页，底部有小程序入口
 */
import './home.scss';
import tpl from './Home.html';
import { uuid } from '@native/utils/util';
import { MiniAppList } from '@native/pages/miniAppList/miniAppList';

/**
 * Home - 微信首页视图
 */
export class Home {
  constructor() {
    this.id = `ui_view${uuid()}`;
    this.parent = null; // 父容器（Application）
    this.el = document.createElement('div');
    this.el.classList.add('wx-native-view');
  }

  /**
   * 视图加载完成回调
   */
  viewDidLoad() {
    this.el.innerHTML = tpl;
    this.bindEvent();
  }

  /**
   * 绑定事件
   */
  bindEvent() {
    // 小程序入口按钮
    const btn = this.el.querySelector('.weixin-app__miniprogram-entry');

    btn.onclick = () => {
      this.jumpToMiniAppListPage();
    };
  }

  /**
   * 跳转到小程序列表页
   */
  jumpToMiniAppListPage() {
    const appListPage = new MiniAppList();
    // 使用 push 动画进入小程序列表
    this.parent.pushView(appListPage);
  }
}
