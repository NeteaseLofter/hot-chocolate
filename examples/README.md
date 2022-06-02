### hot-chocolate 使用具体demo

**目录结构**
```shell
├── examples
  ├── mainApplication
  ├── provideApi # （可以自定义一些接口方便调试）
  ├── react15 # 使用 react15 的子应用
  ├── react16+ # 使用 react16+ 的子应用
  └── vue2 # 使用 vue2.x 的子应用
```
**启动项目**

***在主应用中使用 hot-chocolate***
```shell
pnpm run start --filter ./examples
# 如果需要一些接口请求验证
cd provideApi
node app.js
```





