# hot-chocolate
[![npm version](https://img.shields.io/npm/v/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)
[![npm download](https://img.shields.io/npm/dm/hot-chocolate.svg?maxAge=3600&style=flat-square)](https://www.npmjs.org/package/hot-chocolate)

> 在沙箱中运行你的JS

## 安装
```
npm install hot-chocolate;
```

## API

### 初始化配置
##### sandboxOptions
```js
SandboxOptions: {
  // 初始化时沙箱中生成的HTML
  htmlString: '<html>xx</html>',

  // 可选，初始化HTML后，额外补充的JS
  // 也可以使用 htmlString: '<html><body><script src="your-script.js"></script></body></html>', 代替
  js: [
    'your-script.js'
  ],

  // 可选，初始化HTML后，额外补充的JS
  // 也可以使用 htmlString: '<html><head><link href="your-style.css" rel="stylesheet" /></head></html>', 代替
  css: [
    'your-style.css'
  ]
}
```


## 更多插件
| 名字 | 功能 |
|----|----|
|[@hot-chocolate/plugin-request](https://www.npmjs.org/package/hot-chocolate)| |
