import {
  Manager
} from 'hot-chocolate';
// import { Hook, Application } from 'hot-chocolate';
import {
  createSandboxDispatchPlugin
} from '@hot-chocolate/plugin-dispatch';
function CustomPlugin(
  hooks,
  application // 启动插件的application
) {
  // 对 window 的代理做定制修改
  hooks.window.register(
    'get',
    (end, proxyWindow, property, receiver, rawWindow) => {
      // 比如说我们劫持了 localStorage 的读写
      if (property === 'localStorage') {
        // 通过 end回调返回一个新的对象
        // 这样沙箱里的 localStorage 将不能真正有效，但程序又能正常运行
        return end({
          getItem: () => { },
          removeItem: () => { },
          setItem: (key, newValue) => {
            alert(`要设置${key}: ${newValue}，但是不会生效`);
          },
          // ... 其他补充
        })
      }
    }
  );
}
export const manager = new Manager(
  [

    {
      name: 'app1', // 子应用的名字，必须保证不重复,vue
      sandboxOptions: {
        htmlRemote: 'http://localhost:9529',
        htmlRoot: 'http://localhost:9529'
      }
    },
    {
      name: 'app2', // 子应用的名字，必须保证不重复,react15
      sandboxOptions: {
        // 通过 url 配置沙箱默认html
        // 假设http://abc.com/index.html 返回如下html: `<html><body><div id="root"></div><script src="http://abc.com/app1.js"></script></body></html>`
        htmlRemote: 'http://localhost:9528',
        htmlRoot: 'http://localhost:9528'
      }
    },
    {
      name: 'app3', // 子应用的名字，必须保证不重复,react16
      sandboxOptions: {
        htmlRemote: 'http://localhost:9527',
        htmlRoot: 'http://localhost:9527'
      }
    },
  ],
  [
    CustomPlugin, //自己写了一个插件，插件示例，禁止localstorage使用
    createSandboxDispatchPlugin() // 使用调用插件
  ],
);

