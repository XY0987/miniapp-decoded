/**
 * @file MiniAppList 小程序列表页
 * @description 展示最近使用的小程序列表，点击可打开对应小程序
 */
import './style.scss';
import tpl from './miniAppList.html';
import { uuid, closest } from '@native/utils/util';
import { AppManager } from '@native/core/appManager/appManager';

/**
 * 模拟的小程序列表数据
 * 实际场景中这些数据应该从服务端获取
 */
const appList = [
  {
    appId: 'douyin',
    name: '抖音',
    logo: 'https://img.zcool.cn/community/0173a75b29b349a80121bbec24c9fd.jpg@1280w_1l_2o_100sh.jpg',
    path: 'pages/home/index?param1=参数1&param2=参数2',
  },

  {
    appId: 'meituan',
    name: '美团',
    logo: 'https://s3plus.meituan.net/v1/mss_e2821d7f0cfe4ac1bf9202ecf9590e67/cdn-prod/file:9528bfdf/20201023%E7%94%A8%E6%88%B7%E6%9C%8D%E5%8A%A1logo/%E7%BE%8E%E5%9B%A2app.png',
    path: 'pages/home/index?param1=参数1&param2=参数2',
  },

  {
    appId: 'jingdong',
    name: '京东',
    logo: 'https://ts1.cn.mm.bing.net/th/id/R-C.8e130498abf4685d15ecb977869a5a39?rik=%2f%2bLRdQM48y8y0A&riu=http%3a%2f%2fwww.xiue.cc%2fwp-content%2fuploads%2f2017%2f09%2fjd.jpg&ehk=hUzDTV9xjw%2flaGD5eZcKGl%2fN7UkzBSHRjo73I%2bMeVvo%3d&risl=&pid=ImgRaw&r=0',
    path: 'pages/home/index?param1=参数1&param2=参数2',
  },
];

/**
 * MiniAppList - 小程序列表页视图
 */
export class MiniAppList {
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
    this.createAppList();
    this.bindReturnEvent();
    this.bindOpenMiniApp();
  }

  /**
   * 动态创建小程序列表 DOM
   */
  createAppList() {
    const list = this.el.querySelector('.weixin-app__mini-used-list');

    appList.forEach((appInfo) => {
      const item = `
				<li class="weixin-app__mini-used-list-item" data-appid="${appInfo.appId}">
					<div class="weixin-app__mini-used-logo">
						<img src="${appInfo.logo}" alt="">
					</div>
					<p class="weixin-app__mini-used-name">${appInfo.name}</p>
				</li>
			`;
      const temp = document.createElement('div');

      temp.innerHTML = item;
      list.appendChild(temp.children[0]);
    });
  }

  /**
   * 绑定返回按钮事件
   */
  bindReturnEvent() {
    const backBtn = this.el.querySelector('.weixin-app-navigation__left-btn');

    backBtn.onclick = () => {
      // 使用 pop 动画返回上一页
      this.parent.popView();
    };
  }

  /**
   * 绑定小程序点击事件（事件委托）
   */
  bindOpenMiniApp() {
    const appList = this.el.querySelector('.weixin-app__mini-used-list');

    appList.onclick = (e) => {
      // 使用 closest 找到点击的小程序项
      const app = closest(e.target, 'weixin-app__mini-used-list-item');

      if (!app) {
        return;
      }

      const appId = app.getAttribute('data-appid');
      const appInfo = this.getAppInfoByAppId(appId);

      if (!appInfo) {
        return;
      }

      // 通过 AppManager 打开小程序
      AppManager.openApp(
        {
          appId,
          path: appInfo.path,
          scene: 1001, // 场景值：发现栏小程序主入口
        },
        this.parent
      );
    };
  }

  /**
   * 小程序被切换到后台时调用（空实现）
   */
  onPresentOut() {}

  /**
   * 小程序被切换到前台时调用
   * 恢复状态栏颜色
   */
  onPresentIn() {
    this.parent.updateStatusBarColor('black');
  }

  /**
   * 根据 AppID 获取小程序信息
   * @param {string} appId - 小程序 AppID
   * @returns {Object|null} 小程序信息或 null
   */
  getAppInfoByAppId(appId) {
    for (let i = 0; i < appList.length; i++) {
      if (appList[i].appId === appId) {
        return appList[i];
      }
    }

    return null;
  }
}
