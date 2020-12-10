import { Hook } from '../core/hooks';

export interface WindowHooks {
  window: Hook<{
    has: {
      args: [any, string | number | symbol, Window],
      result: boolean
    },
    get: {
      args: [any, string | number | symbol, ProxyWindow, Window],
      result: any
    },
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

  const proxyName = `proxy${Math.floor(Math.random() * 1E9)}`;

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
