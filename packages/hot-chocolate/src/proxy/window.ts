import { Hook } from '../core/hooks';
import { getUniqueId } from '../utils/unique-id';

export interface WindowHooks {
  window: Hook<{
    /**
     * 针对 in 操作符的代理方法;
     * 同 [Proxy handler.has](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has)
     */
    has: {
      args: [any, string | number | symbol, Window],
      result: boolean
    },
    /**
     * 用于拦截对象的读取属性操作;
     * 同 [Proxy handler.get](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get)
     */
    get: {
      args: [any, string | number | symbol, ProxyWindow, Window],
      result: any
    },
    /**
     * 设置属性值操作的捕获器;
     * 同 [Proxy handler.set](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set)
     */
    set: {
      args: [any, string | number | symbol, any, ProxyWindow, Window],
      result: boolean
    },
  }>;
}

export interface ProxyWindow extends Window {
  __RUN_IN_SANDBOX: true
}

export function createContentWindow (
  hooks: WindowHooks
) {
  const rawWindow = window;

  const windowFunctions = Object.keys(window)
    .filter((propKey) => {
      return typeof (window as any)[propKey] === 'function';
    });
  const proxyWindow: ProxyWindow = new Proxy({
    __RUN_IN_SANDBOX: true
  } as ProxyWindow, {
    has (target, property) {
      if (!rawWindow) {
        console.warn('had clean rawWindow', property)
        return false;
      }
      const { isEnd, result } = hooks.window.evoke('has', target, property, rawWindow);
      if (isEnd) return result;
      return Reflect.has(target, property) || Reflect.has(rawWindow, property)
    },
    get (target, property, receiver) {
      const { isEnd, result } = hooks.window.evoke('get', target, property, receiver, rawWindow);
      if (isEnd) return result;

      if (property === 'window' || property === 'globalThis') {
        return receiver;
      }

      if (
        Reflect.has(target, property)
      ) {
        return Reflect.get(target, property, receiver);
      }

      if (
        property === 'navigator'
      ) {
        return window.navigator;
      }

      let propertyValue: any;
      if (Reflect.has(rawWindow, property)) {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, property)
        propertyValue = Reflect.get(rawWindow, property, rawWindow);
        if (
          descriptor && descriptor.enumerable &&
          typeof propertyValue === 'function'
        ) {
          return function (...args: any) {
            return propertyValue.call(rawWindow, ...args)
          }
        }
      }

      return propertyValue;
    },
    set (target, property, value, receiver) {
      const { isEnd, result } = hooks.window.evoke('set', target, property, value, receiver, rawWindow);
      if (isEnd) return result;
      return Reflect.set(target, property, value, receiver);
    }
  });

  const proxyName = `proxy${getUniqueId()}`;

  const runCode = (js: string, scriptSrc?: string) => {
    var sourceString = scriptSrc ? `//# sourceURL=${scriptSrc}` : '';
    var fn = new Function(proxyName,`with(${proxyName}){\n${js}\n${sourceString}\n}`);
    return fn.call(proxyWindow, proxyWindow);
  }

  return {
    proxyWindow: proxyWindow,
    runCode: runCode
  }
}
