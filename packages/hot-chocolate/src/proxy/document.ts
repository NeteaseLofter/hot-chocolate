import { Hook } from '../core/hooks';

import type { ProxyWindow } from './window';

export interface DocumentHooks {
  document: Hook<{
    /**
     * 针对 in 操作符的代理方法;
     * 同 [Proxy handler.has](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has)
     */
    has: {
      args: [any, string | number | symbol, Document],
      result: boolean
    },
    /**
     * 用于拦截对象的读取属性操作;
     * 同 [Proxy handler.get](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get)
     */
    get: {
      args: [any, string | number | symbol, ProxyDocument, Document],
      result: any
    },
    /**
     * 设置属性值操作的捕获器;
     * 同 [Proxy handler.set](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set)
     */
    set: {
      args: [any, string | number | symbol, any, ProxyDocument, Document],
      result: boolean
    },
  }>;
}

export interface ProxyDocument extends Document {}

export function createDocument (
  hooks: DocumentHooks,
  contentWindow: Window
) {

  const rawDocument = document;

  const proxyDocument = new Proxy({} as any, {
    has (target, property) {
      if (!rawDocument) {
        console.warn('had clean rawDocument', property)
        return false;
      }
      const { isEnd, result } = hooks.document.evoke('has', target, property, rawDocument);
      if (isEnd) return result;
      return Reflect.has(target, property) || Reflect.has(rawDocument, property)
    },
    get (target, property, receiver) {
      const { isEnd, result } = hooks.document.evoke('get', target, property, receiver, rawDocument);
      if (isEnd) return result;
      if (property === 'defaultView') {
        // return fakeGlobal;
        return contentWindow;
      }

      if (
        Reflect.has(target, property)
      ) {
        return Reflect.get(target, property, receiver)
      }

      let propertyValue: any;
      propertyValue = Reflect.get(rawDocument, property, rawDocument);
      if (
        typeof propertyValue === 'function'
      ) {
        return function (...args: any) {
          return propertyValue.call(rawDocument, ...args)
        }
      }
      return propertyValue;
    },
    set (target, property, value, receiver) {
      const { isEnd, result } = hooks.document.evoke('set', target, property, value, receiver, rawDocument);
      if (isEnd) return result;
      return Reflect.set(target, property, value, receiver);
    }
  });

  return {
    proxyDocument: proxyDocument
  }
}