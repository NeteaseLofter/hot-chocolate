# hot-chocolate
[![npm version](https://img.shields.io/npm/v/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)
[![npm download](https://img.shields.io/npm/dm/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)

> 在沙箱中运行你的JS

![](./examples/demo.gif);

## 安装
```
npm install hot-chocolate;
```

## 基础使用例子
```js
import {
  Manager
} from 'hot-chocolate';

const manager = new Manager([
  {
    name: 'app1', // 子应用的名字，必须保证不重复
    sandboxOptions: {
      // 通过 url 配置沙箱默认html
      // 假设http://abc.com/index.html 返回如下html: `<html><body><div id="root"></div><script src="http://abc.com/app1.js"></script></body></html>`
      htmlRemote: 'http://abc.com/index.html'
    }
  },
  {
    name: 'app2',
    sandboxOptions: {
      htmlString: `
        <html>
          <body>
            <div id="root"></div>
            <script>
              window.custom = 'custom';
              window.customFn = (data) => {
                console.log(data);
              }
            </script>
            <script src="app2.js"></script>
          </body>
        </html>
      `
    }
  }
]);

// 激活但不自动挂载到文档流里
// 适合一些提供 纯函数 但是不需要界面的内容
const sandbox = manager.activate('app1');

// 激活并自动挂载到文档流里
// 适合同时会提供界面的内容
const sandbox = manager.activateAndMount('app2', document.body);

// 销毁挂载的子应用,如果不写参数默认销毁所有子应用
manager.deactivateAll('app2')

// ready 可以保证一些异步的js已完成加载
sandbox.ready().then(() => {

  // 可以通过 contentWindow 访问到里面运行的内容
  sandbox.contentWindow.custom === 'custom';

  // 但是里外的window是相互隔离的
  console.log(window.custom) // undefined

  // 还可以直接调用注册在沙箱里的window上的函数
  sandbox.contentWindow.customFn(1); // console: 1

  // 也可以通过 runCode 在沙箱内运行代码
  sandbox.runCode(`
    window.yourCustomData = 1;
  `);

  // 此时可以通过 contentWindow 访问到 runCode 里面运行的内容
  sandbox.contentWindow.yourCustomData === 1;

  // 也可以通过 runRemoteCode 继续挂载其他远程JS
  // 会通过 Fetch 去拉取远程代码
  // 注意跨域问题
  sandbox.runRemoteCode('http://your-site/xx.js');
})
```

## 本地运行examples
1. 先clone本仓库
```bash
git clone https://github.com/NeteaseLofter/hot-chocolate.git
```
2. 安装依赖，也可使用pnpm
```bash
npm run setup
```
3. 运行本地例子，会使用3000端口
```bash
npm run examples
```

## 更多文档
[更多使用例子](./examples/README.md)
[hot-chocolate详细指南](https://github.com/NeteaseLofter/hot-chocolate/tree/master/packages/hot-chocolate)


## 更多插件
| 名字 | 功能 |
|----|----|
|[@hot-chocolate/plugin-request](https://github.com/NeteaseLofter/hot-chocolate/tree/master/packages/plugin-request)| 拦截子应用中发出的AJAX请求 |
|[@hot-chocolate/plugin-dispatch](https://github.com/NeteaseLofter/hot-chocolate/tree/master/packages/plugin-dispatch)| 应用间相互调用 |
