import type {
  Plugin,
  Sandbox
} from 'hot-chocolate';

import {
  DISPATCH_MODULE_KEY,
  DISPATCH_MODULE_EXPORTS_KEY,
  DISPATCH_IMPORT_KEY
} from './contents';

export function getSandboxExports (sandbox: Sandbox) {
  return {
    ...(sandbox.contentWindow as any)[DISPATCH_MODULE_KEY][DISPATCH_MODULE_EXPORTS_KEY],
  };
}

export async function getSandboxExportsAfterReady (sandbox: Sandbox) {
  await sandbox?.ready();
  return getSandboxExports(sandbox);
}

export function createSandboxDispatchPlugin (): Plugin {
  return function (hooks, application, manager) {
    let module = {
      [DISPATCH_MODULE_EXPORTS_KEY]: {} as any
    };
    const dispatchImport = async (
      appName: string,
      {
        mountAt
      }: {
        mountAt?: HTMLElement
      } = {}
    ) => {
      if (!manager) return {};
      const sandbox = await manager.activate(appName);
      if (sandbox) {
        if (mountAt) {
          sandbox.mount(mountAt);
        }
        const exports = await getSandboxExportsAfterReady(sandbox)
        return {
          ...exports,
          __sandbox: sandbox
        };
      }
      return {
        __sandbox: sandbox
      };
    }
    hooks.sandbox.register('beforeInitialization', (end, target) => {
      module[DISPATCH_MODULE_EXPORTS_KEY].__sandboxId = target.id;
      return undefined;
    });
    hooks.window.register('has', (end, target, property) => {
      // 避免通过 for in 等操作被查询到
      if (property === DISPATCH_MODULE_KEY) {
        return end(false)
      };
      if (property === DISPATCH_IMPORT_KEY) return end(false);
      return undefined;
    });
    hooks.window.register('get', (end, target, property) => {
      if (property === DISPATCH_MODULE_KEY) {
        return end(module);
      }
      if (property === DISPATCH_IMPORT_KEY) {
        return end(dispatchImport);
      };
      return undefined;
    });
  }
}
