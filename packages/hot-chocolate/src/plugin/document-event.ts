import type { SandboxHooks, Sandbox } from '../core/sandbox';


export function documentEventPlugin (hooks: SandboxHooks) {
  let currentSandbox: Sandbox;
  const proxyDocumentListeners: any = {};
  hooks.sandbox.register('beforeInitialization', (end, sandbox) => {
    currentSandbox = sandbox;
  })
  hooks.document.register('get', (end, proxyDocument, property, receiver, rawDocument) => {
    if (property === 'addEventListener') {
      return end((type: string, callback: any, ...args: any) => {
        const shadowHostElement = currentSandbox.defaultShadowHostElement;
        const fixCallback = fixEventTarget(callback, shadowHostElement);
        proxyDocumentListeners[
          callback
        ] = fixCallback;
        return proxyDocument.documentElement.addEventListener(type, fixCallback, ...args);
      });
    }

    if (property === 'removeEventListener') {
      return end((type: string, callback: any, ...args: any) => {
        const fixedCallback = proxyDocumentListeners[
          callback
        ];
        return proxyDocument.documentElement.removeEventListener(type, fixedCallback, ...args);
      })
    }

    if (property === 'dispatchEvent') {
      return end((...args: any) => {
        return proxyDocument.documentElement.dispatchEvent(...args)
      });
    }
  })
}

function fixEventTarget (
  callback: any,
  targetElement: HTMLElement
) {
  return function (this: any, event: any) {
    let target = event.target;
    if (target === targetElement) {
      target = event.path[0];
    }
    Object.defineProperty(event, 'target', {
      value: target
    })
    Object.defineProperty(event, 'srcElement', {
      value: target
    })
    return callback.call(this, event);
  }
}
