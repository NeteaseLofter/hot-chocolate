import type { Hook } from './hooks';

import { createShadowDom, parserHTMLString } from '../proxy/shadow-dom';
import type { ShadowDomHooks, HtmlScript } from '../proxy/shadow-dom';
import { createDocument } from '../proxy/document';
import type { DocumentHooks } from '../proxy/document';
import { createContentWindow } from '../proxy/window';
import type { WindowHooks, ProxyWindow } from '../proxy/window';
import { loadRemoteAsText } from '../utils/loader';
import {
  resolve as urlResolve
} from '../utils/url';

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
    },

    replaceCSSString: {
      args: [Sandbox, string, string | undefined],
      result: string
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
  id = `${new Date().getTime()}-${Math.round(1000 * Math.random())}`;

  destroyed = false;
  mounted = false;
  parent: Element;
  shadowRoot: ShadowRoot;
  hooks: SandboxHooks;
  contentWindow: ProxyWindow;
  readyPromise: Promise<void>;
  htmlRoot?: string;
  htmlRemote?: string;
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
    this.htmlRemote = htmlRemote;

    this.hooks.sandbox.evoke('beforeInitialization', this);

    const {
      proxyWindow,
      runCode
    } = createContentWindow(
      hooks,
      {
        /**
         * 自动注入一些沙箱的环境数据
         */
        __SANDBOX_ENV: {
          htmlRoot,
          htmlRemote
        }
      }
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
      readyPromise: shadowDomReadyPromise
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

    try {
      (this.contentWindow.document as any).readyState = 'loading';
    } catch (e) {}
    this.contentWindow.document.dispatchEvent(
      new Event('readystatechange')
    )

    this.readyPromise = new Promise(async (resolve) => {
      await shadowDomReadyPromise;
      await this.runRemoteCodeQueue();

      const exCSSResources = [
        // ...htmlCSSLinks,
        ...(
          resource && resource.css
            ? resource.css.map((css) => ({
              url: css
            }))
            : []
        )
      ];

      for (let i = 0; i < exCSSResources.length; i++) {
        await this.appendRemoteCSS(exCSSResources[i].url);
      }


      const exJSResources = [
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

      try {
        (this.contentWindow.document as any).readyState = 'interactive';
      } catch (e) {}
      this.contentWindow.document.dispatchEvent(
        new Event('readystatechange')
      )
      this.contentWindow.document.dispatchEvent(
        new Event('DOMContentLoaded')
      )

      try {
        (this.contentWindow.document as any).readyState = 'complete';
      } catch (e) {}
      this.contentWindow.document.dispatchEvent(
        new Event('readystatechange')
      )
      this.contentWindow.dispatchEvent(
        new Event('sandbox-load')
      )

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
    } = this.hooks.sandbox.evoke('loadResource', this);

    if (isEnd && result) {
      if (typeof result === 'string') {
        return result;
      }
      return result(url)
    }

    return loadRemoteAsText(url)
  }

  getRemoteURLWithHtmlRoot (remoteUrl: string) {
    if (
      this.htmlRoot
    ) {
      // 适配根目录
      if (remoteUrl.indexOf('/') === 0) {
        return this.htmlRoot + remoteUrl;
      }

      if (remoteUrl.indexOf(window.location.origin) === 0) {
        return this.htmlRoot + remoteUrl.slice(window.location.origin.length);
      }
    }

    if (this.htmlRemote) {
      // 适配相对目录
      return urlResolve(
        this.htmlRemote,
        remoteUrl
      );
    }
    return remoteUrl;
  }

  public replaceCSSString (cssString: string, cssUrl?: string) {
    const {
      isEnd,
      result
    } = this.hooks.sandbox.evoke('replaceCSSString', this, cssString, cssUrl);

    if (isEnd) {
      return result as string;
    }
    return cssString;
  }

  /**
   * 挂载远程 css
   */
  public loadRemoteCSS (cssUrl: string) {
    return this.loadResource(
      this.getRemoteURLWithHtmlRoot(cssUrl)
    ).then((cssString) => {
        return this.replaceCSSString(
          cssString,
          cssUrl
        )
      })
  }

  public async appendRemoteCSS (cssUrl: string) {
    const styleElement = this.contentWindow.document.createElement('style');
    this.contentWindow.document.head.appendChild(styleElement);

    const cssString = await this.loadRemoteCSS(cssUrl);
    styleElement.innerHTML = cssString;
  }

  private remoteCodeQueue: null | (Parameters<Sandbox['runRemoteCode']>)[] = [];

  private async runRemoteCodeQueue () {
    const remoteCodeQueue = this.remoteCodeQueue;
    if (!remoteCodeQueue) return;
    this.remoteCodeQueue = null;
    for (let i = 0; i < remoteCodeQueue.length; i++) {
      const [url, callback] = remoteCodeQueue[i];
      await this.runRemoteCode(url, callback);
    }
  }
  /**
   * 运行js脚本，可以是远程或者脚本字符串
   */
  public loadAndRunCode (
    script: HtmlScript,
    callback?: () => void
  ) {
    if (script.type === 'remote') {
      if (
        this.contentWindow.document.readyState === 'loading'
        && !script.async
        && this.remoteCodeQueue
      ) {
        this.remoteCodeQueue.push([script.url, callback]);
        return;
      }
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
