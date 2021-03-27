import { Hook } from '../core/hooks';

import type { ProxyWindow } from './window';
import type { ProxyDocument } from './document';

import type { Sandbox } from '../core/sandbox';

export interface ShadowDomHooks {
  shadowDom: Hook<{
    /**
     * 在shadowDom完成初始dom创建后被唤起，此时js未加载和运行
     */
    initialization: {
      args: [ShadowDomResult],
      result: ShadowDomResult
    }
  }>;
}

interface ShadowDomResult {
  /**
   * shadow dom的外层节点
   */
  parent: HTMLDivElement;
  /**
   * shadow root: https://developer.mozilla.org/zh-CN/docs/Web/API/ShadowRoot
   */
  shadowRoot: ShadowRoot;
  /**
   * shadow dom内部的 DOM 树里的 head节点
   */
  head: HTMLHeadElement;
  /**
   * shadow dom内部的 DOM 树里的 body节点
   */
  body: HTMLBodyElement;
  /**
   * shadow dom内部的 DOM 树里的 html节点
   */
  html: HTMLHtmlElement;
  /**
   * html中提取出来的内容
   */
  readyPromise: Promise<
    Pick<
      ReturnType<typeof parserHTMLString>,
      Exclude<keyof ReturnType<typeof parserHTMLString>, 'defaultDom'>
    >
  >;
}

interface LocalHtmlScript {
  type: 'local',
  content: string
}
interface RemoteHtmlScript {
  type: 'remote',
  url: string
}

export type HtmlScript = LocalHtmlScript|RemoteHtmlScript;
export type HtmlLink = {
  url: string
}

export function parserHTMLString (htmlString: string) {
  const domParser = new DOMParser();
  let htmlScripts: HtmlScript[] = [];
  let htmlCSSLinks: HtmlLink[] = [];
  let defaultDom: Document;

  defaultDom = domParser.parseFromString(htmlString, 'text/html');
    const scriptNodes = defaultDom.getElementsByTagName('script');
    (Array.prototype.slice.call(scriptNodes, 0) as HTMLScriptElement[])
      .forEach((scriptElement) => {
        if(scriptElement.src) {
          htmlScripts.push({
            type: 'remote',
            url: scriptElement.src
          })
        } else if (scriptElement.innerHTML) {
          htmlScripts.push({
            type: 'local',
            content: scriptElement.innerHTML
          })
        }

        if (scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
      })

    const cssLinkNodes = defaultDom.querySelectorAll('link[rel=stylesheet]');
    (Array.prototype.slice.call(cssLinkNodes, 0) as HTMLLinkElement[])
      .forEach((linkElement) => {
        htmlCSSLinks.push({ url: linkElement.href });
        if (linkElement.parentNode) {
          linkElement.parentNode.removeChild(linkElement);
        }
      })
  return {
    defaultDom,
    htmlScripts,
    htmlCSSLinks
  }
}

export function createShadowDom (
  sandbox: Sandbox,
  hooks: ShadowDomHooks,
  proxyWindow: ProxyWindow,
  proxyDocument: ProxyDocument,
  htmlString?: string,
  htmlRemote?: string,
): ShadowDomResult {
  const parent = document.createElement('div');
  const shadowRoot = parent.attachShadow({ mode: 'open' });
  parent.style.position = 'relative';
  parent.style.overflow = 'hidden';
  parent.style.width = '100%';
  parent.style.height = '100%';


  const fakeHTML = proxyDocument.createElement('html');
  const fakeHead = proxyDocument.createElement('head');
  const fakeBody = proxyDocument.createElement('body');
  fakeHTML.appendChild(fakeHead);
  fakeHTML.appendChild(fakeBody);
  shadowRoot.appendChild(fakeHTML);

  // 使用 htmlRemote，htmlString 将不再生效

  const parserHTML = async () => {
    if (htmlRemote) {
      const remoteHtmlText = await sandbox.loadResource(htmlRemote);
      return parserHTMLString(remoteHtmlText);
    } else if (htmlString) {
      return parserHTMLString(htmlString);
    }

    return {
      defaultDom: null,
      htmlScripts: [],
      htmlCSSLinks: []
    }
  }


  const initHTML = async () => {
    const {
      defaultDom,
      ...other
    } = await parserHTML();

    if (defaultDom) {
      fakeBody.innerHTML = defaultDom.body.innerHTML;
      // fakeHead.innerHTML = defaultDom.head.innerHTML;
      Reflect.set(Object.getPrototypeOf(fakeHead), 'innerHTML', defaultDom.head.innerHTML, fakeHead);
    }

    // 重置 shadow 里的样式
    const initStyle = proxyDocument.createElement('style');
    initStyle.innerHTML = (`
      html,
      body {
        position: relative;
        width: 100%;
        height: 100%;
      }
      html {
        overflow: auto;
      }
      table {
        font-size: inherit;
        white-space: inherit;
        line-height: inherit;
        font-weight: inherit;
        font-size: inherit;
        font-style: inherit;
        text-align: inherit;
        border-spacing: inherit;
        font-variant: inherit;
      }
    `).replace(/\s/g, '');
    if (fakeHead.firstChild) {
      fakeHead.insertBefore(initStyle, fakeHead.firstChild);
    } else {
      fakeHead.appendChild(initStyle);
    }

    return other;
  }


  const data = {
    parent,
    shadowRoot,
    head: fakeHead,
    body: fakeBody,
    html: fakeHTML,
    readyPromise: initHTML()
  };
  const { isEnd, result } = hooks.shadowDom.evoke('initialization', data)
  return isEnd ? result : data;
}