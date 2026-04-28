import type { SandboxHooks, Sandbox } from '../core/sandbox';


export function getElementPlugin (hooks: SandboxHooks) {
  hooks.document.register('get', (end, proxyDocument, property, receiver, rawDocument) => {
    if (property === 'getElementsByTagName') {
      return end((tagName: string) => {
        return proxyDocument.querySelectorAll(tagName);
      });
    }

    if (property === 'querySelector') {
      return end((selectors: string) => {
        return proxyDocument.querySelector(selectors);
      });
    }

    if (property === 'querySelectorAll') {
      return end((selectors: string) => {
        return proxyDocument.querySelectorAll(selectors);
      });
    }

    if (property === 'getElementById') {
      return end((id: string) => {
        return proxyDocument.getElementById(id);
      });
    }

    if (property === 'getElementsByClassName') {
      return end((className: string) => {
        return proxyDocument.querySelectorAll(`.${className}`);
      });
    }
  })
}
