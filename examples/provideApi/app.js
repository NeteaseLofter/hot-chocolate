const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
// 创建一个Koa对象表示web app本身:
const app = new Koa();
const router = new Router();
// 对于任何请求，app将调用该异步函数处理请求：
app.use(cors());
// app.use(async (ctx, next) => {
//     await next(); //表示函数暂停，并将函数传递到下一个定义的中间件,最开始在这里加了ctx.response.body,会导致之前的ctx.response.body被重置了
//     ctx.response.type = 'text/html';
//     // ctx.response.body = '<h1>Hello, koa2!</h1>';
// });

router.get('/hello',(ctx) => {
    ctx.response.body = {data:'this is a api by node in koa way'}
})



// 在端口10001监听:
app.use(router.routes()); //启动路由
app.use(router.allowedMethods()); // 官方文档出现了这个，匹配路由router.routes
app.listen(10001);
console.log('app started at port 10001...');