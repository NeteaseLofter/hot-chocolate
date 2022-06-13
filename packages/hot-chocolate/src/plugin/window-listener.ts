import type { Sandbox, SandboxHooks } from '../core/sandbox';

export function windowListenerPlugin (hooks: SandboxHooks) {
  const proxyListener = new ProxyListener();
  hooks.sandbox.register('initialization', (end, sandbox) => {
    proxyListener.sandbox = sandbox;
  })
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

interface ProxyListenerNode {
  listenerCallback: ListenerCallback,
  types: {
    [typeName: string]: number
  }
}

const captureMap = new Map([
  [true, 0b0001],
  [false, 0b0010]
] as const)

class ProxyListener {
  destroyed = false;

  proxyListenerNodes = new Map<
    ListenerCallback,
    ProxyListenerNode
  >();

  global: Window = window;
  sandbox?: Sandbox;

  proxyAdd = (type: string, callback: ListenerCallback, options?: { capture?: boolean }|boolean) => {
    if (this.destroyed) return;

    const capture = !!(typeof options === 'boolean' ? options : options?.capture);
    const newProxyListenerNode = this.createProxyListenerNode(callback);

    this.global.addEventListener(
      type,
      newProxyListenerNode.listenerCallback,
      options
    );
    const proxyTypeValue = newProxyListenerNode.types[type] || 0;
    newProxyListenerNode.types[type] = proxyTypeValue | (captureMap.get(capture) || 0);
  }

  proxyRemove = (type: string, callback: ListenerCallback, options?: { capture?: boolean }|boolean) => {
    if (this.destroyed) return;

    const capture = !!(typeof options === 'boolean' ? options : options?.capture);
    const proxyListenerNode = this.findProxyListenerNode(callback);
    if (proxyListenerNode) {
      this.global.removeEventListener(
        type,
        proxyListenerNode.listenerCallback,
        options
      );
      const proxyTypeValue = proxyListenerNode.types[type] || 0;
      proxyListenerNode.types[type] = proxyTypeValue & ~(captureMap.get(capture) || 0);
      if (!proxyListenerNode.types[type]) {
        this.proxyListenerNodes.delete(callback);
      }
    }
  }

  proxyDispatch = (event: Event) => {
    // todo: 这个配合沙箱加载成功的事件，是否有更好的办法
    if (event.type === 'sandbox-load') {
      const newEvent = new Event('load');
      const listenerCallbacks = this.findListenerCallbacksByType('load');
      listenerCallbacks.forEach((listenerCallback) => {
        listenerCallback.call(this.sandbox?.contentWindow, newEvent);
      })
    } else {
      this.global.dispatchEvent(event);
    }
  }

  findListenerCallbacksByType (type: string) {
    const proxyListenerNodes = this.proxyListenerNodes;
    const listenerCallbacks: ListenerCallback[] = [];
    proxyListenerNodes.forEach((proxyListenerNode) => {
      const { types, listenerCallback } = proxyListenerNode;
      if (types[type]) {
        listenerCallbacks.push(listenerCallback);
      }
    })
    return listenerCallbacks;
  }

  findProxyListenerNode (callback: ListenerCallback) {
    if (this.proxyListenerNodes.has(callback)) {
      return this.proxyListenerNodes.get(callback);
    }
  }

  createProxyListenerNode (callback: ListenerCallback) {
    let proxyListenerNode: ProxyListenerNode | undefined;
    proxyListenerNode = this.findProxyListenerNode(callback);
    if (proxyListenerNode) {
      return proxyListenerNode;
    }
    const newProxyListener: ProxyListenerNode = {
      listenerCallback: (event) => {
        return callback.call(this.sandbox?.contentWindow, event);
      },
      types: {}
    }
    this.proxyListenerNodes.set(callback, newProxyListener);
    return newProxyListener;
  }

  removeAllListenGlobal () {
    const proxyListenerNodes = this.proxyListenerNodes;
    proxyListenerNodes.forEach((proxyListenerNode) => {
      const { types, listenerCallback } = proxyListenerNode;
      Object.keys(types).forEach((type) => {
        const typeValue = types[type];
        if (typeValue & captureMap.get(true)!) {
          this.global.removeEventListener(type, listenerCallback, true);
        }
        if (typeValue & captureMap.get(false)!) {
          this.global.removeEventListener(type, listenerCallback, false);
        }
      })
    })
    this.proxyListenerNodes = new Map();
  }

  destroy () {
    this.destroyed = true;
    this.removeAllListenGlobal();
  }
}
