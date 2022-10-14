export default function NewFunctionPlugin(
  hooks,
  application // 启动插件的application
) {
  // 对 window 的代理做定制修改
  hooks.window.register(
    'get',
    (end, proxyWindow, property, receiver, rawWindow) => {
      if (property === 'test') {
        console.log('get injected window.test value');
        return end(1)
      }
      if (property === 'Function') {
        // 通过 end回调返回一个新的对象
        const createFakeFunction = function (...args) {
          class FakeFunction extends Function{
            constructor() {
              const args = Array.from(arguments);
              const functionArgs = args.slice(0, -1);
              const functionBody = args.slice(-1);
              // console.log('FakeFunction constructor', arguments, args, functionArgs, functionBody);
              
              return new Function('g', `with(g){\nfunction tempFunc(${functionArgs.join(',')}){${functionBody}}\n};return tempFunc`)(receiver);
            }
          }
          return FakeFunction;
        }
        return end(createFakeFunction())
      }
    }
  );
}