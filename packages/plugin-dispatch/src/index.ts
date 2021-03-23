import type { Plugin } from 'hot-chocolate';

import {
  DISPATCH_MODULE_KEY,
  DISPATCH_MODULE_EXPORTS_KEY,
  DISPATCH_IMPORT_KEY
} from './contents';

export function createSandboxDispatchPlugin (): Plugin {
  return function (hooks, application, manager) {
    const module = {
      [DISPATCH_MODULE_EXPORTS_KEY]: {}
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
      const app = await manager.activate(appName);
      if (app) {
        if (mountAt) {
          app.mount(mountAt);
        }
        await app?.ready();
        return (app.contentWindow as any)[DISPATCH_MODULE_KEY][DISPATCH_MODULE_EXPORTS_KEY];
      }
      return {};
    }
    hooks.window.register('has', (end, target, property) => {
      // 避免通过 for in 等操作被查询到
      if (property === DISPATCH_MODULE_KEY) return end(false);
      if (property === DISPATCH_IMPORT_KEY) return end(false);
      return undefined;
    })
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
