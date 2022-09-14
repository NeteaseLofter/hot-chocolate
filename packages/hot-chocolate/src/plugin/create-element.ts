import type { SandboxHooks, Sandbox } from '../core/sandbox';
import type { DocumentHooks, ProxyDocument } from '../proxy/document';
import { uniqueId } from '../utils/unique-id';

type LoadAndRunCode = Sandbox['loadAndRunCode'];
type LoadRemoteCSS = Sandbox['loadRemoteCSS'];

export function createElementPlugin (hooks: SandboxHooks) {
  let currentSandbox: Sandbox;
  hooks.sandbox.register('beforeInitialization', (end, sandbox) => {
    currentSandbox = sandbox;
  })
  hooks.document.register('get', (end, proxyDocument, property, receiver, rawDocument) => {
    if (property === 'activeElement') {
      const shadowRoot = currentSandbox.shadowRoot;
      let activeElement = rawDocument.activeElement;
      if (activeElement === shadowRoot.host) {
        activeElement = shadowRoot.activeElement;
      }
      return end(activeElement);
    }

    if (property === 'createElement') {
      return end((type: string, ...args: any) => {
        let element;
        if (type === 'script') {
          element = createFakeScriptElement(
            currentSandbox.loadAndRunCode.bind(currentSandbox)
          );
        } else if (type === 'link') {
          element = createFakeLinkElement(
            currentSandbox.loadRemoteCSS.bind(currentSandbox),
            currentSandbox.getRemoteURLWithHtmlRoot.bind(currentSandbox),
          );
        } else {
          element = document.createElement(type, ...args);
          modifyElementNode(element, receiver, currentSandbox);
        }

        return element;
      });
    }

    if (property === 'createElementNS') {
      return end((namespaceURI: string, type: string, ...args: any) => {
        let element;
        if (type === 'script') {
          element = createFakeScriptElement(
            currentSandbox.loadAndRunCode.bind(currentSandbox)
          );
        } else if (type === 'link') {
          element = createFakeLinkElement(
            currentSandbox.loadRemoteCSS.bind(currentSandbox),
            currentSandbox.getRemoteURLWithHtmlRoot.bind(currentSandbox),
          );
          return element;
        } else {
          element = document.createElementNS(namespaceURI, type, ...args);
          modifyElementNode(element, receiver, currentSandbox);
        }

        return element;
      });
    }


    if (property === 'createTextNode') {
      return end((text: string) => {
        let element = document.createTextNode(text);

        return element;
      });
    }
  })
}

function replaceElementNode (
  element: HTMLElement,
  sandbox: Sandbox
) {
  let newElement;
  let type = element.nodeName.toLowerCase();
  if (type === 'script') {
    newElement = createFakeScriptElement(
      sandbox.loadAndRunCode.bind(sandbox)
    );
  } else if (type === 'link') {
    newElement = createFakeLinkElement(
      sandbox.loadRemoteCSS.bind(sandbox),
      sandbox.getRemoteURLWithHtmlRoot.bind(sandbox)
    );
  }
  if (newElement) {
    for (let name of element.getAttributeNames()) {
      let value = element.getAttribute(name);
      newElement.setAttribute(name, value as string);
    }
    newElement.innerHTML = element.innerHTML;
  }
  return newElement;
}

let realConnecting = true;

function modifyElementNode (
  element: Element,
  proxyDocument: ProxyDocument,
  sandbox: Sandbox
) {
  // // 兼容 ownerDocument 获取绑定节点，期待更好办法
  Object.defineProperty(element, 'ownerDocument', {
    value: proxyDocument
  });

  const prototype = Object.getPrototypeOf(element);

  Object.defineProperty(element, 'innerHTML', {
    get: () => {
      return Reflect.get(prototype, 'innerHTML', element);
    },
    set: (value: string) => {
      if (element.tagName.toUpperCase() === 'STYLE') {
        Reflect.set(
          prototype,
          'innerHTML',
          sandbox.replaceCSSString(value),
          element
        );
        return;
      }
      realConnecting = false;
      const domParser = new DOMParser();
      let allChildElements: NodeListOf<Element>;
      let childContainer: HTMLElement;
      if (element.tagName.toUpperCase() === 'HEAD') {
        const doc = domParser.parseFromString('', 'text/html');
        doc.head.innerHTML = value;
        allChildElements = doc.querySelectorAll('head *');
        childContainer = doc.head;
      } else {
        const doc = domParser.parseFromString(value, 'text/html');
        allChildElements = doc.querySelectorAll('body *');
        childContainer = doc.body;
      }

      for(let i = 0; i < allChildElements.length; i++) {
        let childElement = allChildElements[i];
        let currentChildElement;
        if (childElement.nodeType === 1) {
          currentChildElement = replaceElementNode(
            childElement as HTMLElement,
            sandbox
          )
        }
        if (currentChildElement) {
          childElement.parentNode?.replaceChild(
            currentChildElement,
            childElement
          );
        } else {
          modifyElementNode(childElement, proxyDocument, sandbox)
        }
      }
      realConnecting = true;

      // element..innerHTML = '';
      Reflect.set(prototype, 'innerHTML', '', element);
      const childrenNodes = Array.prototype.slice.call(childContainer.childNodes, 0);
      for(let i = 0; i < childrenNodes.length; i++) {
        element.appendChild(childrenNodes[i]);
      }
    }
  });

  if (element.tagName.toUpperCase() === 'STYLE') {
    element.innerHTML = element.innerHTML;
  }

  return element;
}

class FakeScriptElement extends HTMLElement {
  mounted: boolean = false;
  loadAndRunCode!: LoadAndRunCode;

  constructor() {
    super()
  }

  private _savedContent: string = '';

  /**
   * script的innerHTML比较特殊，需要特殊处理
   */
  set innerHTML (newInnerHTML: string) {
    this._savedContent = newInnerHTML;
  };

  get innerHTML () {
    return this._savedContent;
  };

  set innerText (newInnerText: string) {
    this._savedContent = newInnerText;
  };

  get innerText () {
    return this._savedContent;
  };

  get src () {
    return this.getAttribute('src') || '';
  }

  set src (newValue: string) {
    this.setAttribute('src', newValue);
  }

  get type () {
    return this.getAttribute('type') || '';
  }

  set type (newValue: string) {
    this.setAttribute('type', newValue);
  }


  private _tryLoadScript () {
    const src = this.src;
    const type = this.type;
    const _self = this;
    if (
      (
        !type
        || type === 'application/javascript'
        || type === 'text/javascript'
      )
    ) {
      if (src) {
        this.loadAndRunCode(
          {
            type: 'remote',
            url: src,
            async: !!this.getAttribute('async')
          },
          () => {
            if (!this.mounted) return;
            if (src !== _self.src) return;
            if (_self.onload) {
              const loadEvent = new Event('load');
              _self.onload(loadEvent);
              _self.dispatchEvent(loadEvent);
            }
          }
        );
      } else {
        this.loadAndRunCode(
          {
            type: 'local',
            content: _self._savedContent
          },
          () => {}
        );
      }
    }
  }

  disconnectedCallback () {
    this.mounted = false;
  }
  connectedCallback () {
    if (!realConnecting) return;
    this.mounted = true;
    this._tryLoadScript();
  }
}

const fakeScriptName = `sandbox-fake-script-${uniqueId}`;
customElements.define(fakeScriptName, FakeScriptElement);

function createFakeScriptElement (
  loadAndRunCode: LoadAndRunCode
) {
  let fakeScript = document.createElement(fakeScriptName) as FakeScriptElement;
  fakeScript.loadAndRunCode = loadAndRunCode;

  return fakeScript;
}


function modifyElementAttribute (element: HTMLElement, name: string, newValue: string|boolean|null) {
  if (newValue === null) {
    element.removeAttribute(name);
  } else if (typeof newValue === 'boolean') {
    element.setAttribute(name, '');
  } else {
    element.setAttribute(name, newValue);
  }
}


class FakeLinkElement extends HTMLElement {
  loadRemoteCSS!: LoadRemoteCSS;
  getRemoteURLWithHtmlRoot!: Sandbox['getRemoteURLWithHtmlRoot'];

  mounted = false;

  realLinkElement = document.createElement('link');

  realStyleElement = document.createElement('style');

  realElement: HTMLLIElement | HTMLStyleElement;

  onload = (event: any) => {};

  constructor() {
    super()

    this.realElement = this.realLinkElement;
    this.realLinkElement.onload = this.__callOnLoad;
  }

  __callOnLoad = () => {
    if (typeof this.onload === 'function') {
      const loadEvent = new Event('load');
      this.onload(loadEvent);
      this.dispatchEvent(loadEvent);
    }
  }

  // DOMString 穷举 兼容 link 节点操作
  // 参考于：https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLLinkElement
  get as () {
    return this.realLinkElement.as;
  }

  set as (newValue) {
    modifyElementAttribute(this, 'as', newValue);
  }

  get crossOrigin () {
    return this.realLinkElement.crossOrigin;
  }

  set crossOrigin (newValue) {
    modifyElementAttribute(this, 'crossorigin', newValue);
  }

  get disabled () {
    return this.realLinkElement.disabled;
  }

  set disabled (newValue) {
    modifyElementAttribute(this, 'disabled', newValue);
  }

  get href () {
    return this.getAttribute('href');
  }

  set href (newValue) {
    modifyElementAttribute(this, 'href', newValue);
  }

  get hreflang () {
    return this.realLinkElement.hreflang;
  }

  set hreflang (newValue) {
    modifyElementAttribute(this, 'crossorigin', newValue);
  }

  get media () {
    return this.realLinkElement.media;
  }

  set media (newValue) {
    modifyElementAttribute(this, 'media', newValue);
  }

  get rel () {
    return this.realLinkElement.rel;
  }

  set rel (newValue) {
    modifyElementAttribute(this, 'rel', newValue);
  }

  get sizes () {
    return this.realLinkElement.sizes;
  }

  get sheet () {
    return this.realLinkElement.sheet;
  }

  get type () {
    return this.realLinkElement.type;
  }

  set type (newValue) {
    modifyElementAttribute(this, 'type', newValue);
  }

  setAttribute (name: string, value: string) {
    super.setAttribute.call(this, name, value);
    if (name === 'href') {
      value = this.getRemoteURLWithHtmlRoot(value);
    }
    this.realLinkElement.setAttribute(name, value);
    this.__switchRealElement();
    this.__loadStyle();
  }

  removeAttribute (name: string) {
    super.removeAttribute.call(this, name);
    this.realLinkElement.removeAttribute(name);
    if (name === 'rel') {
      this.__switchRealElement();
    }
  }

  __nowLoadedHref?: string;
  __loadStyle () {
    const href = this.getAttribute('href') || this.href;

    if (
      this.__isCSSLink()
      && href
      && this.mounted
      && this.__nowLoadedHref !== href
    ) {
      this.__nowLoadedHref = href;
      this.loadRemoteCSS(
        href
      ).then((cssString) => {
        this.realStyleElement.innerHTML = cssString;
        this.__callOnLoad();
      })
    }
  }

  __isCSSLink () {
    return this.rel === 'stylesheet';
  }

  __switchRealElement () {
    const prevRealElement = this.realElement;
    if (this.__isCSSLink()) {
      this.realElement = this.realStyleElement;
    } else {
      this.realElement = this.realLinkElement;
    }

    if (
      this.mounted
      && prevRealElement !== this.realElement
    ) {
      prevRealElement.parentNode?.removeChild(prevRealElement);
      this.__appendRealElement();
    }
  }

  __appendRealElement () {
    this.parentNode?.insertBefore(
      this.realElement,
      this
    );
  }

  disconnectedCallback () {
    this.mounted = false;
    this.realElement.parentNode?.removeChild(this.realElement)
  }
  connectedCallback () {
    if (!realConnecting) return;
    this.mounted = true;
    this.__appendRealElement();
    this.__loadStyle();
  }
}

const fakeLinkName = `sandbox-fake-link-${uniqueId}`;
customElements.define(fakeLinkName, FakeLinkElement);

function createFakeLinkElement (
  loadRemoteCSS: LoadRemoteCSS,
  getRemoteURLWithHtmlRoot: Sandbox['getRemoteURLWithHtmlRoot']
) {
  let fakeLink = document.createElement(fakeLinkName) as FakeLinkElement;
  fakeLink.loadRemoteCSS = loadRemoteCSS;
  fakeLink.getRemoteURLWithHtmlRoot = getRemoteURLWithHtmlRoot;
  return fakeLink;
}
