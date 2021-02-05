
###
```shell
milk-tea-dev-server --config ./milk-tea-dev-server.config.js
```


### milk-tea-dev-server.config.js
 配置
```js
modules.export = {
  server: {
    port: 9090
  },
  main: {
    remote: 'http://xxxx',
    id: 123
  },
  app: {
    name: 'test',
    sandbox: {
      // 远程url
      html: 'http://127.0.0.1:8080'

      // 本地路径
      html: 'file:///xxx/xx/index.html'

      // 默认htmlStr + 外加js
      html: '<html><body><div id="root"></div></body></html>',
      resource: {
        js: 'http://xxxx.js'
      }
    }
  }
}
```