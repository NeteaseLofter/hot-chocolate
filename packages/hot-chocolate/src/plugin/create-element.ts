import type { SandboxHooks, Sandbox } from '../core/sandbox';
import type { DocumentHooks, ProxyDocument } from '../proxy/document';

type LoadAndRunCode = Sandbox['loadAndRunCode'];

export function createElementPlugin (hooks: SandboxHooks) {
  let currentSandbox: Sandbox;
  hooks.sandbox.register('beforeInitialization', (end, sandbox) => {
    currentSandbox = sandbox;
  })
  hooks.document.register('get', (end, proxyDocument, property, receiver, rawDocument) => {
    if (property === 'createElement') {
      return end((type: string, ...args: any) => {
        let element;
        if (type === 'script') {
          element = createFakeScriptElement(
            currentSandbox.loadAndRunCode.bind(currentSandbox)
          );
        } else if (type === 'link') {
          element = createFakeLinkElement(
            currentSandbox.getRemoteURLWithHtmlRoot.bind(currentSandbox)
          );
        } else {
          element = document.createElement(type, ...args);
        }

        modifyElementNode(element, receiver);
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
            currentSandbox.getRemoteURLWithHtmlRoot.bind(currentSandbox)
          );
        } else {
          element = document.createElementNS(namespaceURI, type, ...args);
        }

        modifyElementNode(element, receiver);
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

function modifyElementNode (element: Element, proxyDocument: ProxyDocument) {
  // // 兼容 ownerDocument 获取绑定节点，期待更好办法
  Object.defineProperty(element, 'ownerDocument', {
    value: proxyDocument
  });

  const prototype = Object.getPrototypeOf(element);
  // console.log(
  //   Reflect.get(element, 'innerHTML', element),
  //   Object.getOwnPropertyDescriptor(prototype, 'innerHTML')
  // )

  Object.defineProperty(element, 'innerHTML', {
    get: () => {
      return Reflect.get(prototype, 'innerHTML', element);
    },
    set: (value: string) => {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(value, 'text/html');
      const allElements = doc.querySelectorAll('body *');
      for(let i = 0; i < allElements.length; i++) {
        modifyElementNode(allElements[i], proxyDocument)
      }

      // element..innerHTML = '';
      Reflect.set(prototype, 'innerHTML', '', element);
      const childrenNodes = Array.prototype.slice.call(doc.body.childNodes, 0);
      for(let i = 0; i < childrenNodes.length; i++) {
        element.appendChild(childrenNodes[i]);
      }
    }
  });
}

class FakeScriptElement extends HTMLElement {
  src?: string;
  mounted: boolean = false;
  loadAndRunCode!: LoadAndRunCode;

  constructor() {
    super()
  }

  private _tryLoadScript () {
    const src = this.src || this.getAttribute('src');
    const _self = this;
    if (src) {
      this.setAttribute('for-src', src);
      this.loadAndRunCode(
        {
          type: 'remote',
          url: src
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
    }
  }

  disconnectedCallback () {
    this.mounted = false;
  }
  connectedCallback () {
    this.mounted = true;
    this._tryLoadScript();
  }
}

const fakeScriptName = `sandbox-fake-script-${Math.floor(Math.random() * 1E9)}`;
customElements.define(fakeScriptName, FakeScriptElement);

function createFakeScriptElement (loadAndRunCode: LoadAndRunCode) {
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
  getRemoteURLWithHtmlRoot!: Sandbox["getRemoteURLWithHtmlRoot"];
  mounted = false;

  realLink = document.createElement('link');

  constructor() {
    super()
  }

  // DOMString 穷举 兼容 link 节点操作
  // 参考于：https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLLinkElement
  get as () {
    return this.realLink.as;
  }

  set as (newValue) {
    modifyElementAttribute(this, 'as', newValue);
  }

  get crossOrigin () {
    return this.realLink.crossOrigin;
  }

  set crossOrigin (newValue) {
    modifyElementAttribute(this, 'crossorigin', newValue);
  }

  get disabled () {
    return this.realLink.disabled;
  }

  set disabled (newValue) {
    modifyElementAttribute(this, 'disabled', newValue);
  }

  get href () {
    return this.realLink.href;
  }

  set href (newValue) {
    modifyElementAttribute(this, 'href', newValue);
  }

  get hreflang () {
    return this.realLink.hreflang;
  }

  set hreflang (newValue) {
    modifyElementAttribute(this, 'crossorigin', newValue);
  }

  get media () {
    return this.realLink.media;
  }

  set media (newValue) {
    modifyElementAttribute(this, 'media', newValue);
  }

  get rel () {
    return this.realLink.rel;
  }

  set rel (newValue) {
    modifyElementAttribute(this, 'rel', newValue);
  }

  get sizes () {
    return this.realLink.sizes;
  }

  get sheet () {
    return this.realLink.sheet;
  }

  get type () {
    return this.realLink.type;
  }

  set type (newValue) {
    modifyElementAttribute(this, 'type', newValue);
  }

  setAttribute (name: string, value: string) {
    if (name === 'href') {
      value = this.getRemoteURLWithHtmlRoot(value);
    }
    super.setAttribute.call(this, name, value);
    this.realLink.setAttribute(name, value);
  }

  removeAttribute (name: string) {
    super.removeAttribute.call(this, name);
    this.realLink.removeAttribute(name);
  }

  __appendRealLink () {
    this.parentNode?.insertBefore(
      this.realLink,
      this
    );
  }

  disconnectedCallback () {
    this.mounted = false;
    this.realLink.parentNode?.removeChild(this.realLink)
  }
  connectedCallback () {
    this.mounted = true;
    this.__appendRealLink();
  }
}

const fakeLinkName = `sandbox-fake-link-${Math.floor(Math.random() * 1E9)}`;
customElements.define(fakeLinkName, FakeLinkElement);

function createFakeLinkElement (getRemoteURLWithHtmlRoot: Sandbox["getRemoteURLWithHtmlRoot"]) {
  let fakeLink = document.createElement(fakeLinkName) as FakeLinkElement;
  fakeLink.getRemoteURLWithHtmlRoot = getRemoteURLWithHtmlRoot;
  return fakeLink;
}
