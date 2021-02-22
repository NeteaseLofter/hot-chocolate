# @hot-chocolate/plugin-request
[![npm version](https://img.shields.io/npm/v/@hot-chocolate/plugin-request.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/@hot-chocolate/plugin-request)
[![npm download](https://img.shields.io/npm/dm/@hot-chocolate/plugin-request.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/@hot-chocolate/plugin-request)

## 安装
```
npm install @hot-chocolate/plugin-request
```

## 使用
```js
import {
  Manager
} from 'hot-chocolate';
import {
  createSandboxRequestPlugin
} from '@hot-chocolate/plugin-request';

new Manager(
  [...],
  [
    createSandboxRequestPlugin({
      // 请求发送前的勾子
      beforeRequest: (
        options, // { url: string, method: string } 请求参数
        application // 启动的application
      ) => {
        // 返回新的请求url及method
        return {
          url: 'xxxx',
          method: 'POST'
        }
      },

    })
  ]
)
```