/**
 * @file componentProxy 组件代理
 * @description 统一处理小程序组件的事件代理
 *
 * 核心功能：
 * 解析 bind* 属性，将组件事件转发给逻辑层
 *
 * 事件流程：
 * 1. 编译器将 wxml 中的 bindtap="methodName" 转换为 Vue 属性
 * 2. 组件 created 时，遍历 $attrs 找到 bind* 属性
 * 3. 使用 $on 监听对应的自定义事件
 * 4. 事件触发时，通过 JSBridge 通知 Native，再转发给逻辑层
 *
 * 示例：
 * <ui-view bindtap="handleClick">  // wxml
 *     ↓ 编译
 * <ui-view :bindtap="'handleClick'">  // Vue 模板
 *     ↓ 点击触发 tap 事件
 * JSBridge.onReceiveUIMessage({type:'trrigerEvent', body:{methodName:'handleClick'}})
 *     ↓ Native 转发
 * 逻辑层执行 page.handleClick()
 */

/**
 * 组件代理工厂函数
 * 为 Vue 组件添加事件代理能力
 *
 * @param {string} name - 组件名称（如 'ui-view'）
 * @param {Object} opts - Vue 组件配置
 */
export function componentProxy(name, opts) {
  // 注入 mixin，在 created 时处理事件绑定
  opts.mixins = [
    {
      /**
       * created 钩子
       * 遍历组件属性，为 bind* 属性设置事件监听
       */
      created() {
        // 遍历所有传入的属性
        for (let attr in this.$attrs) {
          // 只处理 bind 开头的属性（如 bindtap、bindinput）
          if (!/^bind/.test(attr)) {
            continue;
          }

          // 属性值为空则跳过
          if (!this.$attrs[attr]) {
            continue;
          }

          // 提取事件名（bindtap → tap）
          const eventName = attr.replace(/^bind/, '');
          // 获取逻辑层的方法名
          const methodName = this.$attrs[attr];
          // 获取页面实例 ID（用于定位是哪个页面）
          const { id } = this.$vnode.context._bridgeInfo;

          // 监听组件的自定义事件
          this.$on(eventName, () => {
            // 通过 JSBridge 通知 Native，转发给逻辑层
            window.JSBridge.onReceiveUIMessage({
              type: 'trrigerEvent',
              body: {
                methodName, // 要执行的方法名
                id, // 页面实例 ID
              },
            });
            console.log('事件被触发');
          });
        }
      },
    },
  ];

  // 注册为 Vue 全局组件
  Vue.component(name, opts);
}
