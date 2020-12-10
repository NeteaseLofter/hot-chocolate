import { Hook, Application } from 'hot-chocolate';
import type { SandboxHooks, Plugin } from 'hot-chocolate';

export interface RequestHooks extends SandboxHooks {
  request: Hook<{}>
}

export function createSandboxRequestPlugin ({
  beforeRequest
}: {
  beforeRequest?: (
    options: { url: string, method: string },
    application: Application
  ) => { url: string, method: string }
} = {}): Plugin {
  return function (hooks: SandboxHooks, application: Application) {
    const requestHook = new Hook();
    hooks.request = requestHook;
    hooks.window.register('get', (end, proxyWindow, property, receiver, rawWindow) => {
      if (property === 'XMLHttpRequest') {
        return end(createFakeXMLHttpRequest);
      }

      if (property === 'fetch') {
        return end(fakeFetch);
      }
    });

    const fakeFetch = (url: string|Request, options: any) => {
      if (beforeRequest) {
        if (typeof url === 'string') {
          let currentURL = url;
          options = options || {};
          let currentMethod = options.method;
          let newConfig = beforeRequest({
            url: currentURL,
            method: currentMethod
          }, application)
          currentURL = newConfig.url;
          currentMethod = newConfig.method;
          return fetch(currentURL,  {
            ...options,
            method: currentMethod
          });
        } else {
          let currentRequest: Request = url;
          let currentURL = currentRequest.url;
          let currentMethod = currentRequest.method;
          let newConfig = beforeRequest({
            url: currentURL,
            method: currentMethod
          }, application);
          return fetch(new Request(
            newConfig.url,
            {
              ...currentRequest,
              method: newConfig.method
            }
          ));
        }
      }
      return fetch(url, options);
    }

    const createFakeXMLHttpRequest = function (...args: any) {
      let rawXHR = new XMLHttpRequest();

      return new Proxy(rawXHR, {
        has (target, property) {
          return Reflect.has(target, property)
        },

        get (target, property, receiver) {
          let value = Reflect.get(target, property, target);
          if (property === 'open') {
            return (method: string, url: string, ...args: any) => {
              let currentURL = url;
              let currentMethod = method;
              if (beforeRequest) {
                let newConfig = beforeRequest({
                  url: currentURL,
                  method: currentMethod
                }, application)
                currentURL = newConfig.url;
                currentMethod = newConfig.method;
              }
              return value.call(target, currentMethod, currentURL, ...args);
            };
          }

          if (typeof value === 'function') {
            value = value.bind(target);
          }

          return value;
        },

        set (target, property, value, receiver) {
          return Reflect.set(target, property, value, target);
        }
      })
    }
  }
}
