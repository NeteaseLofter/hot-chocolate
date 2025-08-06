import { Manager, Sandbox } from 'hot-chocolate';
import {
  createSandboxDispatchPlugin,
  getSandboxExportsAfterReady,
  getSandboxExports
} from '../src/index';
import {
  DISPATCH_IMPORT_KEY,
  DISPATCH_MODULE_KEY,
  DISPATCH_MODULE_EXPORTS_KEY
} from '../src/contents';

const manager = new Manager([
  {
    name: 'app-a',
    sandboxOptions: {
      htmlString: `
      <html><body>
        <script>
        const {
          dispatchPluginExports
        } = require('../src/export');
        const exports = dispatchPluginExports;

        exports.getCustom = () => {
          return 'app-a-custom';
        }

        exports.render = (text) => {
          return document.body.innerHTML = text;
        }

        exports.body = document.body;
        </script>
        </body></html>
      `
    }
  },
  {
    name: 'app-b',
    sandboxOptions: {
      htmlString: `
      <html><body>
      <script>
      const {
        dispatchPluginImport
      } = require('../src/import');

      dispatchPluginImport('app-a', {
        mountAt: document.body
      }).then((appA) => {
          const appACustom = appA.getCustom();
          appA.render('appB dispatch render appA');

          window.ready(
            appACustom,
            appA
          );
        })
      </script>
      </body></html>
      `
    }
  }
], [
  createSandboxDispatchPlugin(),
  function mockRequire(hooks) {
    let sandbox: Sandbox;
    hooks.sandbox.register('initialization', (end, target) => {
      sandbox = target;
    })
    hooks.window.register('has', (end, target, property) => {
      if (property === 'require') return end(true);
    })
    hooks.window.register('get', (end, target, property) => {
      if (property === 'require') {
        return end((id: string) => {
          if (id === '../src/export') {
            return {
              dispatchPluginModule: (sandbox.contentWindow as any)[DISPATCH_MODULE_KEY],
              dispatchPluginExports: (sandbox.contentWindow as any)[DISPATCH_MODULE_KEY][DISPATCH_MODULE_EXPORTS_KEY]
            }
          }
          if (id === '../src/import') {
            return {
              dispatchPluginImport: (sandbox.contentWindow as any)[DISPATCH_IMPORT_KEY],
            }
          }
          return require(id);
        });
      }
    });
  }
])

describe('plugin-dispatch', () => {
  test('import success', async () => {
    const sandbox = await manager.activateAndMount('app-b', document.body);
    await new Promise<void>((resolve) => {
      (sandbox?.contentWindow as any).ready = (appACustom: any, appAExports: any) => {
        expect(appACustom).toBe('app-a-custom');
        expect(appAExports.body.innerHTML).toBe('appB dispatch render appA');
        resolve();
      }
    })
    manager.deactivateAll();
  });

  test('get exports success', async () => {
    const sandbox = await manager.activate('app-a');
    if (!sandbox) return;
    sandbox.mount(document.body);
    const exports = await getSandboxExportsAfterReady(sandbox);
    expect(exports.getCustom()).toBe('app-a-custom');
    expect(exports.render).toBeDefined();
    expect(exports.body).toBe(sandbox.contentWindow.document.body);
  });
})
