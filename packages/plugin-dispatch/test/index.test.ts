import { Manager, Sandbox } from 'hot-chocolate';
import { createSandboxDispatchPlugin } from '../src/index';
import {
  DISPATCH_IMPORT_KEY,
  DISPATCH_MODULE_KEY
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

        dispatchPluginExports.getCustom = () => {
          return 'app-a-custom';
        }

        dispatchPluginExports.render = (text) => {
          return document.body.innerHTML = text;
        }

        dispatchPluginExports.body = document.body;
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
          (window as any)[DISPATCH_MODULE_KEY] = (sandbox.contentWindow as any)[DISPATCH_MODULE_KEY];
          (window as any)[DISPATCH_IMPORT_KEY] = (sandbox.contentWindow as any)[DISPATCH_IMPORT_KEY];
          const result = require(id);
          delete (window as any)[DISPATCH_MODULE_KEY]
          delete (window as any)[DISPATCH_IMPORT_KEY];
          return result;
        });
      }
    });
  }
])

describe('plugin-dispatch', () => {
  test('success', async () => {
    const sandbox = await manager.activate('app-b');
    await new Promise<void>((resolve) => {
      (sandbox?.contentWindow as any).ready = (appACustom: any, appA: any) => {
        expect(appACustom).toBe('app-a-custom');
        expect(appA.body.innerHTML).toBe('appB dispatch render appA');
        resolve();
      }
    })
  });
})
