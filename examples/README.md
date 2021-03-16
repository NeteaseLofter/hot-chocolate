### hot-chocolate 使用具体demo 

**目录结构**
```
-mainApplication  
-react15 
-react16
-vue2  
-provideApi （可以自定义一些接口方便调试）

// 分别为主应用,React子应用,Vue子应用
```
**启动项目**

***在主应用中使用 hot-chocolate***
```
// 进入主应用
cd examples
// 对于每一个应用，开一个node进程
npm install
npm start 
//如果需要一些接口请求验证
cd provideApi
node app.js
```





