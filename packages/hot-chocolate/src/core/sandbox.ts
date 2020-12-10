import type { Hook } from './hooks';

import { createShadowDom } from '../proxy/shadow-dom';
import type { ShadowDomHooks, HtmlScript } from '../proxy/shadow-dom';
import { createDocument } from '../proxy/document';
import type { DocumentHooks } from '../proxy/document';
import { createContentWindow } from '../proxy/window';
import type { WindowHooks, ProxyWindow } from '../proxy/window';
import { loadScriptAsText } from '../utils/loader';

export interface SandboxHooks extends ShadowDomHooks, DocumentHooks, WindowHooks {
  sandbox: Hook<{
    beforeInitialization: {
      args: [Sandbox],
      result: void
    },
    initialization: {
      args: [Sandbox],
      result: void
    },
    destroy: {
      args: [Sandbox],
      result: void
    },
    mount: {
      args: [Sandbox],
      result: void
    },
    unmount: {
      args: [Sandbox],
      result: void
    }
  }>,
  [other: string]: undefined|Hook<any>
}

export interface SandboxOptions {
  htmlString?: string
  resource?: {
    js: string[],
    css: string[]
  },

  onDestroy?: () => void
}

export class Sandbox {

  destroyed = false;
  mounted = false;
  parent: Element;
  shadowRoot: ShadowRoot;
  hooks: SandboxHooks;
  contentWindow: ProxyWindow;
  readyPromise: Promise<void>;
  onDestroy?: () => void;

  runCode: (js: string, scriptSrc?: string | undefined) => any;

  constructor (
    hooks: SandboxHooks,
    {
      htmlString,
      resource,
      onDestroy
    }: SandboxOptions = {}
  ) {
    this.hooks = hooks;
    this.onDestroy = onDestroy;

    this.hooks.sandbox.evoke('beforeInitialization', this);

    const {
      proxyWindow,
      runCode
    } = createContentWindow(
      hooks
    );

    this.contentWindow = proxyWindow;
    this.runCode = runCode;

    const {
      proxyDocument
    } = createDocument(
      hooks,
      proxyWindow
    );

    Reflect.set(proxyWindow, 'document', proxyDocument);

    const {
      parent,
      shadowRoot,
      html,
      body,
      head,
      htmlScripts
    } = createShadowDom(
      hooks,
      proxyWindow,
      proxyDocument,
      htmlString
    );
    this.parent = parent;
    this.shadowRoot = shadowRoot;
    Reflect.set(proxyDocument, 'documentElement', html);
    Reflect.set(proxyDocument, 'head', head);
    Reflect.set(proxyDocument, 'body', body);

    this.hooks.sandbox.evoke('initialization', this);

    this.readyPromise = (async () => {
      const exCSSResources = [
        ...(
          resource && resource.css
            ? resource.css.map((css) => ({
              url: css
            }))
            : []
        )
      ];

      for (let i = 0; i < exCSSResources.length; i++) {
        await this.loadRemoteCSS(exCSSResources[i].url);
      }

      const exJSResources = [
        ...htmlScripts,
        ...(
          resource && resource.js
            ? resource.js.map((js) => ({
              type: 'remote' as 'remote',
              url: js
            }))
            : []
        )
      ];

      for (let i = 0; i < exJSResources.length; i++) {
        await this.loadAndRunCode(exJSResources[i]);
      }
    })();
  }

  ready () {
    return this.readyPromise;
  }

  loadRemoteCSS (cssUrl: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.contentWindow.document.head.appendChild(link);
  }

  loadAndRunCode (script: HtmlScript, callback?: () => void) {
    if (script.type === 'remote') {
      return this.runRemoteCode(script.url, callback);
    } else {
      return this.runCode(script.content);
    }
  }

  runRemoteCode (remoteScriptUrl: string, callback?: () => void) {
    return loadScriptAsText(remoteScriptUrl)
      .then((scriptString) => {
        this.runCode(scriptString, remoteScriptUrl);
        callback && callback();
      })
  }

  mount (appContainer: Element) {
    if (this.destroyed) {
      console.error('sandbox had destroyed, can not mount')
      return;
    }

    appContainer.appendChild(
      this.parent
    );
    this.mounted = true;
    this.hooks.sandbox.evoke('mount', this);
  }

  unmount () {
    if (this.mounted) {
      if (this.parent.parentNode) {
        this.parent.parentNode.removeChild(this.parent);
      }
      this.mounted = false;
      this.hooks.sandbox.evoke('unmount', this);
    }
  }

  destroy () {
    this.unmount();

    this.destroyed = true;

    this.hooks.sandbox.evoke('destroy', this);
    if (this.onDestroy) {
      this.onDestroy();
    }
  }
}
