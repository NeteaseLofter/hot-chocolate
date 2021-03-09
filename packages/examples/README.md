### hot-chocolate 使用具体demo 

**目录结构**
```
-mainApplication  
-subReactApplication  
-subVueApplication  

// 分别为主应用,React子应用,Vue子应用
```
**启动项目**

***起一个服务加载应用本地资源,可以使用 http-server***
```
// 安装http-server
npm install --global http-server
//进入资源目录
cd packages/examples
//启动，允许跨域
hs --cors
```

***在主应用中使用 hot-chocolate***
```
// 进入主应用
cd packages/examples/mainApplication
// 启动
npm install
npm start 
```
***运行结果截图***
 ![image](https://github.com/NeteaseLofter/hot-chocolate/blob/examples/packages/examples/demo.gif)




