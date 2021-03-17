# mille-crepe-cli
这个是为微前端发布cli, 可以帮助你直接发布到应用平台


## 命令说明

### mille-crepe config
用于配置全局的用户信息

#### 设置config
```shell
mille-crepe config --set [name]=[value]
```

#### 查询config配置内容
```shell
mille-crepe config --get [name]
```


### mille-crepe upload
用于上传新版本
```shell
lofter-admin-cli upload --config app.js
```


#### app.js upload配置文件说明
```javascript
module.exports = {
  /**
   * @param {number} appId - 必填
   * 子应用注册后分配的应用Id
   */
  appId: 123,

  /**
   * @param {string} secret - 可选
   * 登录应用平台后在个人页查看到的上传密钥
   * 也可以通过 lofter-admin-cli config --set secret=xxx设置到本地
   */
  secret: 'xxxxxxx',

  /**
   * @param {string} remote - 可选，一般无需添加
   * 指定上传的应用平台地址
   */
  remote: ''

  /**
   * @param {string} rootDir - 必填
   * 需上传文件根目录，相对于 app.js 的路径
   */
  rootDir: 'dist',

  /**
   * @param {string} html - 可选
   * 重要：html 和 entry 至少使用一个，否则无法正确启动该应用
   * 指定加载的html文件地址，路径相对于rootDir
   * 使用 html 模式支持webpack分包，此时 publicPath 设置为 '/' 即可
   */
  html: 'index.html',

  /**
   * @param {string[]} entry - 可选
   * 重要：html 和 entry 至少使用一个，否则无法正确启动该应用
   * 额外的入口文件，相对于rootDir, 支持 * 通配符
   * 会自动挂载到html中
   * 配置html后，一般无需再次配置 entry
   */
  entry: ['umi.css', 'umi.js'],

  /**
   * @param {string[]} excludes - 可选
   * 不需要上传的文件，相对于rootDir，可以用于减少上传的文件数量，加快上传速度
   */
  excludes: ['xxx.yyy'],

  /**
   * @param {string[]} includes - 可选
   * 指定需要上传的文件，相对于rootDir
   */
  includes: [],

  /**
   * @param {Object} requestRewrite - 可选
  *  客户端请求重写配置，key value形式
  *  请求url如果匹配由key生成的正则，会用value进行replace
  *  此处统一配置，可以免于修改每处请求的url
  */
  requestRewrite: {}
}
```
