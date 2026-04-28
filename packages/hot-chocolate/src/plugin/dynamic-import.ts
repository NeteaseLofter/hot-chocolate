import type { SandboxHooks } from '../core/sandbox';
import type { Sandbox } from '../core/sandbox';
import type { ProxyWindow } from '../proxy/window';
import { resolve as urlResolve } from '../utils/url';
import { transformEsmModuleSource } from './esm-transform';

/**
 * 沙箱内动态加载：`__hcDynamicImport` / 转换后的 `import()`。
 * 被加载文件可写 ESM（静态/动态 import、export、import.meta），执行前会改写为 Script + async。
 */
export const HC_DYNAMIC_IMPORT = '__hcDynamicImport' as const;

/**
 * 模块命名空间（与转换后的 export / default import 对齐）；
 * 纯脚本仍可直接赋值此属性作为 `import()` 返回值。
 */
export const HC_DYNAMIC_MODULE_EXPORT = '__hcDynamicModuleExport' as const;

const emptyNamespace = () =>
  Object.freeze(Object.create(null) as Record<string, unknown>);

function readModuleNamespaceCopy (proxyWindow: ProxyWindow): Record<string, unknown> {
  const raw = Reflect.get(proxyWindow, HC_DYNAMIC_MODULE_EXPORT);
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.freeze({ ...raw });
  }
  return emptyNamespace();
}

const windowToSandbox = new WeakMap<ProxyWindow, Sandbox>();
const urlPromiseCache = new WeakMap<
  Sandbox,
  Map<string, Promise<Record<string, unknown>>>
>();

function cacheFor (sandbox: Sandbox) {
  let m = urlPromiseCache.get(sandbox);
  if (!m) {
    m = new Map();
    urlPromiseCache.set(sandbox, m);
  }
  return m;
}

function resolveModuleUrl (
  sandbox: Sandbox,
  specifier: string,
  referrerUrl?: string
) {
  const base =
    referrerUrl
    || sandbox.htmlRemote
    || (typeof window !== 'undefined' ? window.location.href : '');
  const isAbs = /^(\w[\w+.-]*:|\/\/|\/)/.test(specifier);
  const path = isAbs ? specifier : urlResolve(base, specifier);
  return {
    moduleUrl: path,
    finalUrl: sandbox.getRemoteURLWithHtmlRoot(path)
  };
}

function createDynamicImport (sandbox: Sandbox) {
  const proxyWindow = sandbox.contentWindow as ProxyWindow;

  return async function __hcDynamicImport (
    specifier: string,
    referrerUrl?: string
  ): Promise<Record<string, unknown>> {
    if (sandbox.destroyed) {
      return emptyNamespace();
    }
    const { moduleUrl, finalUrl } = resolveModuleUrl(sandbox, specifier, referrerUrl);
    const cache = cacheFor(sandbox);
    let p = cache.get(finalUrl);
    if (p) {
      return p;
    }
    p = (async () => {
      const code = await sandbox.loadResource(finalUrl);
      if (sandbox.destroyed) {
        return emptyNamespace();
      }
      let inner: string;
      try {
        inner = await transformEsmModuleSource(code, finalUrl);
      } catch (e) {
        console.error('[hot-chocolate] ESM transform failed', finalUrl, e);
        throw e;
      }
      if (sandbox.destroyed) {
        return emptyNamespace();
      }
      const savedExport = Reflect.get(proxyWindow, HC_DYNAMIC_MODULE_EXPORT);
      Reflect.set(proxyWindow, HC_DYNAMIC_MODULE_EXPORT, {});
      let settled = false;
      const execDone = new Promise<void>((resolve, reject) => {
        Reflect.set(proxyWindow, '__hcModuleDone', () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        });
        Reflect.set(proxyWindow, '__hcModuleFail', (err: unknown) => {
          if (!settled) {
            settled = true;
            reject(
              err instanceof Error ? err : new Error(String(err))
            );
          }
        });
      });
      try {
        const wrapped = `
;(function(__ok,__fail,__moduleUrl){
  (async function(){
    try {
      ${inner}
      __ok();
    } catch(e) {
      __fail(e);
    }
  })();
})(__hcModuleDone, __hcModuleFail, ${JSON.stringify(moduleUrl)});
`;
        sandbox.runCode(wrapped, finalUrl);
        await execDone;
        return readModuleNamespaceCopy(proxyWindow);
      } finally {
        if (savedExport !== undefined) {
          Reflect.set(proxyWindow, HC_DYNAMIC_MODULE_EXPORT, savedExport);
        } else {
          try {
            Reflect.deleteProperty(proxyWindow, HC_DYNAMIC_MODULE_EXPORT);
          } catch {
            /* ignore */
          }
        }
      }
    })();
    cache.set(finalUrl, p);
    return p;
  };
}

const sandboxToFn = new WeakMap<Sandbox, ReturnType<typeof createDynamicImport>>();

export function dynamicImportPlugin (hooks: SandboxHooks) {
  hooks.sandbox.register('initialization', (end, sandbox) => {
    const cw = sandbox.contentWindow as ProxyWindow;
    windowToSandbox.set(cw, sandbox);
    const fn = createDynamicImport(sandbox);
    sandboxToFn.set(sandbox, fn);
    /**
     * 必须挂在 proxy target 上，with(proxy) 里才能解析 __hcDynamicImport（has 为 true）。
     */
    Reflect.set(cw, HC_DYNAMIC_IMPORT, fn);
  });

  hooks.sandbox.register('destroy', (end, sandbox) => {
    urlPromiseCache.delete(sandbox);
    sandboxToFn.delete(sandbox);
    const cw = sandbox.contentWindow as ProxyWindow;
    windowToSandbox.delete(cw);
    try {
      Reflect.deleteProperty(cw, HC_DYNAMIC_IMPORT);
      Reflect.deleteProperty(cw, '__hcModuleDone' as keyof ProxyWindow);
      Reflect.deleteProperty(cw, '__hcModuleFail' as keyof ProxyWindow);
    } catch {
      /* ignore */
    }
  });
}
