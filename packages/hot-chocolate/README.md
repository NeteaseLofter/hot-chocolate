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
const manager = new Manager(
  [
    {
      // 这里就是一个 ApplicationConfig 应用配置
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

#### ApplicationConfig 应用配置
```js
ApplicationConfig: {
  name: 'appName', // 应用名字，不能重复,
  sandboxOptions: {} // 沙箱的运行配置，参考下面的说明
}
```

#### sandboxOptions 应用启动沙箱用配置
```js
SandboxOptions: {
  /**
   * @param htmlRemote
   * 通过直接请求远程url拿到 html 的方式加载html
   * 注意跨域问题
   * 和 htmlString 只能选择其中一个
   */
  htmlRemote: 'http://abc.com/index.html',

  /**
   * @param htmlRoot
   * htmlRemote 中 加载相对路径的js、css资源时的路径
   * 比如：
   * 当前页面url(浏览器显示的)为： http://abc.com/index.html
   * 加载js为： <script src="/my.js"></script>
   *
   * 1. 未设置 htmlRoot:
   * 则加载的js路径为 http://abc.com/my.js
   *
   * 2. 设置 htmlRoot 为: 'http://xyz.com/static'
   * 则加载的js路径为 http://xyz.com/static/my.js
   *
   * 重要：该功能属于实验性功能，可能会修改
   */
  htmlRoot: 'http://abc.com/static',

  /**
   * @param htmlString
   * 初始化时沙箱中生成的HTML
   * 和一般的html一致即可
   * 和 htmlRemote 只能选择其中一个
   */
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

  /**
   * @param resource
   * @param {string[]} resource.js - 额外的js
   * @param {string[]} resource.css - 额外的css
   * 额外的js,css资源
   * 也可以使用 htmlString:
   * `<html>
   *    <head><link href="your-style.css" rel="stylesheet" /></head>
   *    <body><script src="your-script.js"></script></body>
   * </html>`代替
   */
  resource?: {
    js: [
      'your-script.js'
    ],
    css: [
      'your-style.css'
    ]
  }
}
```

## Manager实例上的函数和属性
##### manager.updateApp(appName, appConfig)
更新/增加 一个Application到 manager 上。
如果该应用已经有激活的沙箱，会全部销毁。
```js
const manager = new Manager(...);
manager.updateApp(
  'app1', // 应用名字
  {} // ApplicationConfig 和初始化中的一样的格式
)
```

##### manager.uninstallApps(appName)
卸载已注册到manager的某个应用
如果该应用已经有激活的沙箱，会全部销毁
```js
manager.uninstallApp(
  'appName' // 需要卸载的应用名字
)
```

##### manager.resetApps(newAppConfigs)
重置所有配置的app
```js
manager.resetApps([
  {} // ApplicationConfig 和初始化中的一样的格式
])
```

##### manager.activate(appName)
通过 appName 激活某一个应用的沙箱实例。
此时 sandbox 不会自动挂载到html DOM里，可以后面通过`sandbox.mount`挂载到指定DOM节点。
```js
const sandbox = manager.activate(
  'appName' // 通过 appName 激活某一个应用的沙箱实例
)
```

##### manager.activateAndMount(appName, container)
通过 appName 激活某一个应用的沙箱，并执行挂载到html DOM节点。
等于 `manager.activate` + `sandbox.mount`.
```js
const sandbox = manager.activateAndMount(
  'appName',
  document.body // 一个任意的的DOM节点
)
```

##### manager.findOrActivate(appName)
通过 appName 查找一个已激活的沙箱实例，如果没有就激活一个新的。
```js
const sandbox = manager.findOrActivate(
  'appName'
)
```

##### manager.deactivateAll([appName])
销毁所有已经激活的沙箱。
- 如果传了appName: 销毁该app下的所有已经激活的沙箱；
- 如果没传appName: 销毁所有app下的所有已经激活的沙箱；
```js
const sandbox = manager.deactivateAll();
```


## Sandbox实例上的函数和属性
##### sandbox.ready()
htmlRemote, resource.js 资源全部加载完毕后执行。
返回一个promise
```js
sandbox.ready().then(() => {
  ...
})
```

##### sandbox.loadRemoteCSS(cssUrl)
通过url，在沙箱内加载一个css。
```js
sandbox.loadRemoteCSS(
  'http://xx.com/yy.css'
)
```

##### sandbox.runRemoteCode(remoteScriptUrl[, callback])
通过url，在沙箱内运行一个js。
```js
sandbox.remoteScriptUrl(
  'http://xx.com/yy.js',
  () => {
    // 此时js已运行完成
  }
)
```

##### sandbox.runCode(scriptString)
在沙箱内运行一个js。
```js
sandbox.runCode(
  `window.xxx = 1;`
)
```

##### sandbox.mount(container)
把沙箱挂载到一个DOM节点上。
```js
sandbox.mount(
  document.body
)
```

##### sandbox.unmount()
把沙箱从挂载的DOM节点上卸载。

##### sandbox.destroy()
销毁沙箱，会同执行`sandbox.unmount`。



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
          setItem: () => {},
          // ... 其他补充
        })
      }
    }
  );
}

const manager = new Manager(
  [ ... ],
  [
    CustomPlugin
  ]
)
```

### 插件 hooks API


#### hooks.sandbox
沙箱本身的一些生命周期。


##### hooks.sandbox.register('beforeInitialization')
在sandbox 创建 window,document,dom之前被唤起。
```js
hooks.sandbox.register(
  'beforeInitialization',
  (
    end, // 通用的结束回调
    sandbox // 创建sandbox实例，此时无contentWindow,parent等属性
  ) => {}
)
```

##### hooks.sandbox.register('initialization')
参数同 **beforeInitialization**。
在sandbox完成 window,document,dom创建后被唤起。

##### hooks.sandbox.register('destroy')
参数同 **beforeInitialization**。
在sandbox 完成销毁后被唤起。

##### hooks.sandbox.register('mount')
参数同 **beforeInitialization**。
在sandbox 执行 mount 完成挂载到页面后被唤起

##### hooks.sandbox.register('unmount')
参数同 **beforeInitialization**。
在sandbox 执行 unmount 完成从文档流卸载后被唤起
如果之前调用过 mount 完成挂载，那在执行 destroy 时也会被唤起


#### hooks.window
沙箱代理 window 对象的生命周期。


##### hooks.sandbox.register('has')
针对 in 操作符的代理方法。
参考[Proxy handler.has](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has)

```js
hooks.window.register(
  'has',
  (
    end, // 通用的结束回调
    proxyWindow, // 被proxy代理的window, 沙箱中代码访问的内容
    property, // 需要检查是否存在的属性
    rawWindow // 原始的window对象
  ) => {
    return end(true); // 返回 true or false, 用于in的判断
  }
)
```

##### hooks.sandbox.register('get')
用于拦截对象的读取属性操作。
参考[Proxy handler.get](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get)

```js
hooks.window.register(
  'get',
  (
    end, // 通用的结束回调
    proxyWindow, // 被proxy代理的window, 沙箱中代码访问的内容
    property, // 被获取的属性名
    receiver, // Proxy或者继承Proxy的对象，来自 Proxy
    rawWindow // 原始的window对象
  ) => {
    return end(any); // 可以返回任何值，同 Proxy handler.get
  }
)
```

##### hooks.sandbox.register('set')
设置属性值操作的捕获器。
参考[Proxy handler.set](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set)

```js
hooks.window.register(
  'get',
  (
    end, // 通用的结束回调
    proxyWindow, // 被proxy代理的window, 沙箱中代码访问的内容
    property, // 被获取的属性名
    value, // 新属性值
    receiver, // Proxy或者继承Proxy的对象，来自 Proxy
    rawWindow // 原始的window对象
  ) => {
    return end(true); // 应当返回一个布尔值，同 Proxy handler.set
  }
)
```


#### hooks.document
沙箱代理 document 对象的生命周期。


##### hooks.sandbox.register('has' ｜ 'get' | 'set', () => {})
唤起时机为 document 的各种操作。
回调格式和 window的 has|get|set 相同，只是 proxyWindow 替换为 proxyDocument, rawWindow 替换为 rawDocument


#### hooks.shadowDom
沙箱创建shadow dom及初始化内部DOM树的生命周期。

[shadow dom 相关文档](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_shadow_DOM)


##### hooks.shadowDom.register('initialization')
在shadowDom完成初始dom创建后被唤起，此时js未加载和运行
```js
hooks.sandbox.register(
  'beforeInitialization',
  (
    end, // 通用的结束回调
    shadowDomResult // shadowDom 创建结果
  ) => {}
)
```

shadowDomResult 详细内容
```js
shadowDomResult: {
  parent: HTMLDivElement; // shadow dom的外层节点
  shadowRoot: ShadowRoot; // shadow root: https://developer.mozilla.org/zh-CN/docs/Web/API/ShadowRoot
  head: HTMLHeadElement; // shadow dom内部的 DOM 树里的 head节点
  body: HTMLBodyElement; // shadow dom内部的 DOM 树里的 body节点
  html: HTMLHtmlElement; // shadow dom内部的 DOM 树里的 html节点
  htmlScripts: HtmlScript[]; // html中提取出来的需要加载的js内容
}
```
