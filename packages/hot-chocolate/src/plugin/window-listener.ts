import type { SandboxHooks } from '../core/sandbox';

export function windowListenerPlugin (hooks: SandboxHooks) {
  const proxyListener = new ProxyListener(window);
  hooks.window.register('get', function (end, target, property) {
    if (property === 'addEventListener') {
      return end(proxyListener.proxyAdd);
    }
    if (property === 'removeEventListener') {
      return end(proxyListener.proxyRemove);
    }
    if (property === 'dispatchEvent') {
      return end(proxyListener.proxyDispatch);
    }
  });

  hooks.sandbox.register('destroy', () => {
    proxyListener.destroy();
  })
}

interface ListenerCallback {
  (event: any): void;
}

class ProxyListener {
  destroyed = false;
  private _listeners = {} as {
    [type: string]: {
      'true'?: ListenerCallback[],
      'false'?: ListenerCallback[]
    }
  };

  globalListeners = {} as {
    [type: string]: {
      'true'?: ListenerCallback,
      'false'?: ListenerCallback
    }
  };

  global: Window;

  constructor (global: Window) {
    this.global = window;
  }

  proxyAdd = (type: string, callback: ListenerCallback, options?: { capture?: boolean }|boolean) => {
    if (this.destroyed) return;
    const currentCapture = !!(typeof options === 'object' ? options.capture : options);
    if (!this.hadListenGlobal(type, currentCapture)) {
      this.listenGlobal(type, currentCapture);
    }
    this.add(type, currentCapture, callback);
  }

  proxyRemove = (type: string, callback: ListenerCallback, options?: { capture?: boolean }|boolean) => {
    if (this.destroyed) return;
    const currentCapture = !!(typeof options === 'object' ? options.capture : options);
    this.remove(type, currentCapture, callback);
  }

  proxyDispatch = (event: any) => {
    if (this.destroyed) return;
    const type = event.type;
    this.globalCallback(type, true, event);
    this.globalCallback(type, false, event);
  }

  hadListenGlobal (type: string, capture: boolean) {
    return this.globalListeners[type] && this.globalListeners[type][capture.toString() as 'true'|'false'];
  }

  listenGlobal (type: string, capture: boolean) {
    const globalCallback = this.globalCallback.bind(this, type, capture);
    this.global.addEventListener(type, globalCallback, capture);
    if (!this.globalListeners[type]) {
      this.globalListeners[type] = {};
    }
    this.globalListeners[type][capture.toString() as 'true'|'false'] = globalCallback;
  }

  removeAllListenGlobal () {
    const globalListeners = this.globalListeners;
    Object.keys(globalListeners).forEach((type) => {
      const typedListener = globalListeners[type];
      if (typedListener['true']) {
        this.global.removeEventListener(type, typedListener['true'], true);
      }
      if (typedListener['false']) {
        this.global.removeEventListener(type, typedListener['false'], false);
      }
    })
    this.globalListeners = {};
  }


  globalCallback (type: string, capture: boolean, event: any) {
    const listeners = this.getListeners(type, capture);
    listeners.forEach((listener) => {
      listener(event);
    })
  }

  getListeners (type: string, capture: boolean) {
    const captureString = capture.toString() as 'true'|'false';
    if (!this._listeners[type]) {
      this._listeners[type] = {};
    }
    if (!this._listeners[type][captureString]) {
      this._listeners[type][captureString] = [];
    }
    return this._listeners[type][captureString] as ListenerCallback[];
  }

  add (type: string, capture: boolean, callback: ListenerCallback) {
    const listeners = this.getListeners(type, capture);
    listeners.push(callback);
  }

  remove (type: string, capture: boolean, callback: ListenerCallback) {
    const listeners = this.getListeners(type, capture);
    const index = listeners.findIndex((listener) => (listener === callback));
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  destroy () {
    this.destroyed = true;
    this._listeners = {};
    this.removeAllListenGlobal();
  }
}
