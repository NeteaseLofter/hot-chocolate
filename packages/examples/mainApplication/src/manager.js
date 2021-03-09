import {
    Manager
} from 'hot-chocolate';
export const manager = new Manager([
    {
        name: 'app1', // 子应用的名字，必须保证不重复
        sandboxOptions: {
            // 通过 url 配置沙箱默认html
            // 假设http://abc.com/index.html 返回如下html: `<html><body><div id="root"></div><script src="http://abc.com/app1.js"></script></body></html>`
            htmlRemote: 'http://127.0.0.1:8080/subReactApplication/react.html',
            htmlRoot: 'http://127.0.0.1:8080/subReactApplication'
        }
    },
    {
        name: 'app2', // 子应用的名字，必须保证不重复
        sandboxOptions: {
            htmlRemote: 'http://127.0.0.1:8080/subVueApplication/vue.html',
        }
    },
]);

