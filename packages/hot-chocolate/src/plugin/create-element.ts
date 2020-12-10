import type { SandboxHooks, Sandbox } from '../core/sandbox';
import type { DocumentHooks, ProxyDocument } from '../proxy/document';

type loadAndRunCode = Sandbox['loadAndRunCode'];

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
          element = createFakeScript(
            currentSandbox.loadAndRunCode.bind(currentSandbox)
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
          element = createFakeScript(
            currentSandbox.loadAndRunCode.bind(currentSandbox)
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

class FakeScript extends HTMLElement {
  src?: string;
  mounted: boolean = false;
  loadAndRunCode!: loadAndRunCode;

  constructor() {
    super()
  }

  private _tryLoadScript () {
    const src = this.src;
    const _self = this;
    if (src) {
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
customElements.define('sandbox-fake-script', FakeScript);

function createFakeScript (loadAndRunCode: loadAndRunCode) {
  let fakeScript = document.createElement('sandbox-fake-script') as FakeScript;
  fakeScript.loadAndRunCode = loadAndRunCode;

  return fakeScript;
}
