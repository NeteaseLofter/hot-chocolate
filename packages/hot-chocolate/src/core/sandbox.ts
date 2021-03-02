import type { Hook } from './hooks';

import { createShadowDom, parserHTMLString } from '../proxy/shadow-dom';
import type { ShadowDomHooks, HtmlScript } from '../proxy/shadow-dom';
import { createDocument } from '../proxy/document';
import type { DocumentHooks } from '../proxy/document';
import { createContentWindow } from '../proxy/window';
import type { WindowHooks, ProxyWindow } from '../proxy/window';
import { loadScriptAsText, loadRemoteAsText } from '../utils/loader';

export interface SandboxHooks extends ShadowDomHooks, DocumentHooks, WindowHooks {
  sandbox: Hook<{
    /**
     * 在sandbox 创建 window,document,dom之前被唤起
     */
    beforeInitialization: {
      args: [Sandbox],
      result: void
    },
    /**
     * 在sandbox完成 window,document,dom创建后被唤起
     */
    initialization: {
      args: [Sandbox],
      result: void
    },
    /**
     * 在sandbox完成 初始化的 html、js、css加载后被唤起
     */
    ready: {
      args: [Sandbox],
      result: void
    },
    /**
     * 在sandbox 完成销毁后被唤起
     */
    destroy: {
      args: [Sandbox],
      result: void
    },
    /**
     * 在sandbox 执行 mount 完成挂载到页面后被唤起
     */
    mount: {
      args: [Sandbox],
      result: void
    },
    /**
     * 在sandbox 执行 unmount 完成从文档流卸载后被唤起
     * 如果之前调用过 mount 完成挂载，那在执行 destroy 时也会被唤起
     */
    unmount: {
      args: [Sandbox],
      result: void
    }
  }>,
  [other: string]: undefined|Hook<any>
}

export interface SandboxOptions {
  /**
   * html string
   * `
   * <html><body>xxx</body></html>
   * `
   */
  htmlString?: string,

  /**
   * 远程的 html url， 比如 http://xxx.com/index.html
   * 注意跨域问题
   */
  htmlRemote?: string,

  /**
   * 加载相对路径的js、css资源时的路径
   * 比如：
   * 当前 页面url为： http://abc.com/index.html
   * 加载js为： <script src="/my.js"></script>
   * 1. 未设置 htmlRoot:
   * 则加载的js路径为 http://abc.com/my.js
   *
   * 2. 设置 htmlRoot 为: 'http://xyz.com/static'
   * 则加载的js路径为 http://xyz.com/static/my.js
   */
  htmlRoot?: string,

  /**
   * 额外的js,css资源
   */
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
  htmlRoot?: string;
  onDestroy?: () => void;

  runCode: (js: string, scriptSrc?: string | undefined) => any;

  constructor (
    hooks: SandboxHooks,
    {
      htmlString,
      htmlRemote,
      htmlRoot,
      resource,
      onDestroy
    }: SandboxOptions = {}
  ) {
    this.hooks = hooks;
    this.onDestroy = onDestroy;
    this.htmlRoot = htmlRoot;

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
      readyPromise
    } = createShadowDom(
      hooks,
      proxyWindow,
      proxyDocument,
      htmlString,
      htmlRemote
    );
    this.parent = parent;
    this.shadowRoot = shadowRoot;
    Reflect.set(proxyDocument, 'documentElement', html);
    Reflect.set(proxyDocument, 'head', head);
    Reflect.set(proxyDocument, 'body', body);

    this.hooks.sandbox.evoke('initialization', this);

    this.readyPromise = new Promise(async (resolve) => {
      const { htmlScripts, htmlCSSLinks } = await readyPromise;
      const exCSSResources = [
        ...htmlCSSLinks,
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

      this.hooks.sandbox.evoke('ready', this);
      resolve();
    });
  }

  ready () {
    return this.readyPromise;
  }

  getRemoteURLWithHtmlRoot (remoteUrl: string) {
    if (
      this.htmlRoot
      && remoteUrl.indexOf('/') === 0
    ) {
      return this.htmlRoot + remoteUrl;
    }
    return remoteUrl;
  }

  loadRemoteCSS (cssUrl: string) {
    cssUrl = this.getRemoteURLWithHtmlRoot(cssUrl);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.contentWindow.document.head.appendChild(link);
    return link;
  }

  loadAndRunCode (script: HtmlScript, callback?: () => void) {
    if (script.type === 'remote') {
      return this.runRemoteCode(script.url, callback);
    } else {
      return this.runCode(script.content);
    }
  }

  runRemoteCode (remoteScriptUrl: string, callback?: () => void) {
    remoteScriptUrl = this.getRemoteURLWithHtmlRoot(remoteScriptUrl);
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
