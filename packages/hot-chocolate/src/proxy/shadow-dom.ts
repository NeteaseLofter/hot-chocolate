import { Hook } from '../core/hooks';

import type { ProxyWindow } from './window';
import type { ProxyDocument } from './document';

export interface ShadowDomHooks {
  shadowDom: Hook<{
    initialization: {
      args: [ShadowDomResult],
      result: ShadowDomResult
    }
  }>;
}

interface ShadowDomResult {
  parent: HTMLDivElement;
  shadowRoot: ShadowRoot;
  head: HTMLHeadElement;
  body: HTMLBodyElement;
  html: HTMLHtmlElement;
  htmlScripts: HtmlScript[];
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

export function createShadowDom (
  hooks: ShadowDomHooks,
  proxyWindow: ProxyWindow,
  proxyDocument: ProxyDocument,
  htmlStr?: string
): ShadowDomResult {
  const parent = document.createElement('div');
  const shadowRoot = parent.attachShadow({ mode: 'open' });
  parent.style.position = 'relative';
  parent.style.overflow = 'hidden';
  parent.style.width = '100%';
  parent.style.height = '100%';

  let htmlScripts: HtmlScript[] = [];

  let defaultDom: Document|null = null;
  if (htmlStr) {
    const domParser = new DOMParser();
    defaultDom = domParser.parseFromString(htmlStr, 'text/html');
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
  }


  const fakeHTML = proxyDocument.createElement('html');
  const fakeHead = proxyDocument.createElement('head');
  const fakeBody = proxyDocument.createElement('body');
  fakeHTML.appendChild(fakeHead);
  fakeHTML.appendChild(fakeBody);
  shadowRoot.appendChild(fakeHTML);
  if (defaultDom) {
    fakeBody.innerHTML = defaultDom.body.innerHTML;
    // fakeHead.innerHTML = defaultDom.head.innerHTML;
    Reflect.set(Object.getPrototypeOf(fakeHead), 'innerHTML', defaultDom.head.innerHTML, fakeHead);
  }

  const initStyle = proxyDocument.createElement('style');
  initStyle.innerHTML = `
    html,body {
      position: relative;
      width: 100%;
      height: 100%;
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
  `;
  if (fakeHead.firstChild) {
    fakeHead.insertBefore(initStyle, fakeHead.firstChild);
  } else {
    fakeHead.appendChild(initStyle);
  }

  const data = {
    parent,
    shadowRoot,
    head: fakeHead,
    body: fakeBody,
    html: fakeHTML,
    htmlScripts: htmlScripts
  };
  const { isEnd, result } = hooks.shadowDom.evoke('initialization', data)
  return isEnd ? result : data;
}