# hot-chocolate
[![npm version](https://img.shields.io/npm/v/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)
[![npm download](https://img.shields.io/npm/dm/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)

> 在沙箱中运行你的JS

## 安装
```
npm install hot-chocolate;
```

## 说明
hot-chocolate 的核心包，主要负责沙箱的创建和管理

## 基本使用方法
```js
import { Manager } from 'hot-chocolate';

new Manager(
  [
    // 应用列表
  ],
  [
    // 配置的插件
  ]
)
```

## 配置应用

### 初始化配置
```js
new Manager(
  [
    {
      name: 'app1' // 应用名字，不能重复,
      sandboxOptions: {} // 沙箱的运行配置，参考下面的说明
    },
    {  // 可以配置多个，只要name不重复
      name: 'app2'
      sandboxOptions: {}
    }
  ]
)
```

#### sandboxOptions
```js
SandboxOptions: {
  // 初始化时沙箱中生成的HTML
  // 和一般的html一致即可
  htmlString: `
    <html>
      <head>
        <link href="your-style.css" rel="stylesheet" />
        可以添加多个css文件
      </head>
      <body>
        <script src="your-script.js"></script>
        可以添加多个script标签来加载不同JS
        <script>
          var a = 1;
        </script>
        也可以直接运行JS脚本
        * 需要注意的是，这里的script不会阻塞html加载，都会在html加载完后再运行JS
      </body>
    </html>`,

  // 可选，初始化HTML后，额外补充的JS
  // 也可以使用 htmlString: '<html><body><script src="your-script.js"></script></body></html>'代替
  js: [
    'your-script.js'
  ],

  // 可选，初始化HTML后，额外补充的CSS
  // 也可以使用 htmlString: '<html><head><link href="your-style.css" rel="stylesheet" /></head></html>'代替
  css: [
    'your-style.css'
  ]
}
```

## 使用插件
```js
import { Manager } from 'hot-chocolate';
import {
  createSandboxRequestPlugin
} from '@hot-chocolate/plugin-request';

new Manager(
  [ ... ],
  [
    // 这里以请求拦截插件为例
    // 每个插件的使用方法不同，请参考插件的使用文档
    // 或者可以阅读下文的插件开发，了解插件的运行机制
    createSandboxRequestPlugin(...)
  ]
)
```

## 开发自己的插件
只需导出一个函数，函数的内容如下：
```js
function CustomPlugin (
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
          getItem: () => {},
          removeItem: () => {},
          setItemItem: () => {},
          // ... 其他补充
        })
      }
    }
  );
}

new Manager(
  [ ... ],
  [
    CustomPlugin
  ]
)
```
