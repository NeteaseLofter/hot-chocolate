import { Hook } from '../core/hooks';
import { uniqueId } from '../utils/unique-id';

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
  parent: HTMLElement;
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

export interface LocalHtmlScript {
  type: 'local';
  content: string;
  node?: HTMLScriptElement;
}
export interface RemoteHtmlScript {
  type: 'remote';
  url: string;
  async?: boolean;
  node?: HTMLScriptElement;
}

export type HtmlScript = LocalHtmlScript | RemoteHtmlScript;
export type HtmlLink = {
  url: string
}

export function parserHTMLString (htmlString: string) {
  const domParser = new DOMParser();
  // let htmlCSSLinks: HtmlLink[] = [];
  let defaultDom: Document;

  htmlString = htmlString.replace(/<noscript>.*?<\/noscript>/, '');
  defaultDom = domParser.parseFromString(htmlString, 'text/html');

  return {
    defaultDom
  }
}

export function createShadowDom (
  parent: HTMLElement,
  sandbox: Sandbox,
  hooks: ShadowDomHooks,
  proxyDocument: ProxyDocument,
  htmlString?: string,
  htmlRemote?: string,
): ShadowDomResult {
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
      defaultDom: null
    }
  }


  const initHTML = async () => {
    const {
      defaultDom
    } = await parserHTML();

    if (defaultDom) {
      fakeBody.innerHTML = defaultDom.body.innerHTML;
      fakeHead.innerHTML = defaultDom.head.innerHTML;
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
      noscript {
        display: none;
      }
    `).replace(/\s/g, '');
    if (fakeHead.firstChild) {
      fakeHead.insertBefore(initStyle, fakeHead.firstChild);
    } else {
      fakeHead.appendChild(initStyle);
    }

    return true;
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


export class SandboxShadowHostElement extends HTMLElement {
  sandbox: Sandbox;
  html: HTMLHtmlElement;
  head: HTMLHeadElement;
  body: HTMLBodyElement;
  readyPromise: ReturnType<typeof createShadowDom>['readyPromise'];

  shadowRoot!: Exclude<HTMLElement['shadowRoot'], null>;

  constructor (
    sandbox: Sandbox,
    options: {
      htmlString?: string;
      htmlRemote?: string;
    } = {}
  ) {
    super();

    this.sandbox = sandbox;
    const {
      html,
      body,
      head,
      readyPromise
    } = createShadowDom(
      this,
      sandbox,
      sandbox.hooks,
      sandbox.contentWindow.document,
      options?.htmlString,
      options?.htmlRemote
    );

    this.html = html;
    this.head = head;
    this.body = body;
    this.readyPromise = readyPromise;
  }

  disconnectedCallback () {
    this.sandbox.removeForkedShadowHostElement(this);
  }
  connectedCallback () {
    this.sandbox.addForkedShadowHostElement(this);
  }
}
const sandboxElementName = `sandbox-shadow-element-${uniqueId}`;
customElements.define(sandboxElementName, SandboxShadowHostElement);


