# hot-chocolate
[![npm version](https://img.shields.io/npm/v/hot-chocolate.svg?maxAge=3600)](https://www.npmjs.org/package/hot-chocolate)
[![npm download](https://img.shields.io/npm/dm/hot-chocolate.svg?maxAge=3600)](https://www.npmjs.org/package/hot-chocolate)

run js sandbox on browser


## 基本用法
```js
const manager = new Manager([
  {
    name: 'app1',
    sandboxOptions: {
      htmlString: `<html><body><div id="root"></div></body></html>`
    }
  },
  {
    name: 'app2',
    sandboxOptions: {
      htmlString: `<html><body><div id="root"></div></body></html>`
    }
  }
]);

// 激活但不自动挂砸到文档流里
const sandbox = manager.activate('app1');

// 激活并自动挂砸到文档流里
const sandbox = manager.activateAndMount('app2', document.body);
```