import {
    Manager
} from 'hot-chocolate';
export const manager = new Manager([
    {
        name: 'app1', // 子应用的名字，必须保证不重复,react15
        sandboxOptions: {
            // 通过 url 配置沙箱默认html
            // 假设http://abc.com/index.html 返回如下html: `<html><body><div id="root"></div><script src="http://abc.com/app1.js"></script></body></html>`
            htmlRemote: 'http://localhost:9528',
            htmlRoot: 'http://localhost:9528'
        }
    },
    {
        name: 'app2', // 子应用的名字，必须保证不重复,vue
        sandboxOptions: {
            htmlRemote: 'http://localhost:9529',
            htmlRoot: 'http://localhost:9529'
        }
    },
    {
        name: 'app3', // 子应用的名字，必须保证不重复,react16
        sandboxOptions: {
            htmlRemote: 'http://localhost:9527',
            htmlRoot: 'http://localhost:9527'
        }
    },
]);

