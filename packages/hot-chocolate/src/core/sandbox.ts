import type { Hook } from './hooks';

import { createShadowDom, parserHTMLString } from '../proxy/shadow-dom';
import type { ShadowDomHooks, HtmlScript } from '../proxy/shadow-dom';
import { createDocument } from '../proxy/document';
import type { DocumentHooks } from '../proxy/document';
import { createContentWindow } from '../proxy/window';
import type { WindowHooks, ProxyWindow } from '../proxy/window';
import { loadRemoteAsText } from '../utils/loader';

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
    },
    /**
     * 在sandbox 加载资源时被唤起
     * 返回一个回调函数，在回调函数中自定义加载方式
     */
    loadResource: {
      args: [Sandbox],
      result: (url: string) => Promise<string>
    }
  }>,
  [other: string]: undefined|Hook<any>
}

export interface SandboxOptions {
  /**
   * @param htmlString
   * `
   * <html><body>xxx</body></html>
   * `
   * 和 htmlRemote 只能选择其中一个
   */
  htmlString?: string,

  /**
   * @param htmlRemote
   * 远程的 html url， 比如 http://xxx.com/index.html
   * 注意跨域问题
   * 和 htmlString 只能选择其中一个
   */
  htmlRemote?: string,

  /**
   * @param htmlRoot
   * 加载相对路径的js、css资源时的路径
   * 比如：
   * 当前 页面url为： http://abc.com/index.html
   * 加载js为： <script src="/my.js"></script>
   * 1. 未设置 htmlRoot:
   * 则加载的js路径为 http://abc.com/my.js
   *
   * 2. 设置 htmlRoot 为: 'http://xyz.com/static'
   * 则加载的js路径为 http://xyz.com/static/my.js
   *
   * 重要：该功能属于实验性功能，可能会修改
   */
  htmlRoot?: string,

  /**
   * @param resource
   * @param {string[]} resource.js - 额外的js
   * @param {string[]} resource.css - 额外的css
   * 额外的js,css资源
   */
  resource?: {
    js: string[],
    css: string[]
  },

  onDestroy?: () => void
}

/**
 * @class
 */
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
      this,
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

  /**
   * @async
   *
   * htmlRemote, resource 资源全部加载完毕后执行
   */
   public ready () {
    return this.readyPromise;
  }

  async loadResource (url: string) {
    const {
      isEnd,
      result
    } = this.hooks.sandbox.evoke('fetchResource', this, url);

    if (isEnd) {
      return result(url)
    }

    return loadRemoteAsText(url)
  }

  getRemoteURLWithHtmlRoot (remoteUrl: string) {
    if (
      this.htmlRoot
    ) {
      if (remoteUrl.indexOf('/') === 0) {
        return this.htmlRoot + remoteUrl;
      }

      if (remoteUrl.indexOf(window.location.origin) === 0) {
        return this.htmlRoot + remoteUrl.slice(window.location.origin.length);
      }
    }
    return remoteUrl;
  }

  /**
   * 挂载远程 css, 通过link标签
   * @returns 创建的link节点
   */
  public loadRemoteCSS (cssUrl: string) {
    const link = this.contentWindow.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.contentWindow.document.head.appendChild(link);
    return link;
  }

  /**
   * 运行js脚本，可以是远程或者脚本字符串
   */
  public loadAndRunCode (script: HtmlScript, callback?: () => void) {
    if (script.type === 'remote') {
      return this.runRemoteCode(script.url, callback);
    } else {
      return this.runCode(script.content);
    }
  }

  /**
   * 通过url运行远程js脚本
   * 注意跨域问题
   */
  public runRemoteCode (remoteScriptUrl: string, callback?: () => void) {
    remoteScriptUrl = this.getRemoteURLWithHtmlRoot(remoteScriptUrl);
    return this.loadResource(remoteScriptUrl)
      .then((scriptString) => {
        this.runCode(scriptString, remoteScriptUrl);
        callback && callback();
      }, () => {
        // fetch error：比如跨域失败
      })
  }

  public mount (container: Element) {
    if (this.destroyed) {
      console.error('sandbox had destroyed, can not mount')
      return;
    }

    container.appendChild(
      this.parent
    );
    this.mounted = true;
    this.hooks.sandbox.evoke('mount', this);
  }

  public unmount () {
    if (this.mounted) {
      if (this.parent.parentNode) {
        this.parent.parentNode.removeChild(this.parent);
      }
      this.mounted = false;
      this.hooks.sandbox.evoke('unmount', this);
    }
  }

  public destroy () {
    this.unmount();

    this.destroyed = true;

    this.hooks.sandbox.evoke('destroy', this);
    if (this.onDestroy) {
      this.onDestroy();
    }
  }
}
