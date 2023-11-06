import type { SandboxHooks, Sandbox } from '../core/sandbox';


export function getElementPlugin (hooks: SandboxHooks) {
  let currentSandbox: Sandbox;
  hooks.sandbox.register('beforeInitialization', (end, sandbox) => {
    currentSandbox = sandbox;
  })
  hooks.document.register('get', (end, proxyDocument, property, receiver, rawDocument) => {
    if (property === 'getElementsByTagName') {
      return end((tagName: string) => {
        return currentSandbox.defaultShadowHostElement.html.getElementsByTagName(tagName);
      });
    }

    if (property === 'querySelector') {
      return end((selectors: string) => {
        return currentSandbox.defaultShadowHostElement.shadowRoot.querySelector(selectors);
      });
    }

    if (property === 'querySelectorAll') {
      return end((selectors: string) => {
        return currentSandbox.defaultShadowHostElement.shadowRoot.querySelectorAll(selectors);
      });
    }

    if (property === 'getElementById') {
      return end((id: string) => {
        return currentSandbox.defaultShadowHostElement.shadowRoot.getElementById(id);
      });
    }

    if (property === 'getElementsByClassName') {
      return end((className: string) => {
        return currentSandbox.defaultShadowHostElement.html.getElementsByClassName(className);
      });
    }
  })
}
