import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  Application,
  HC_DYNAMIC_IMPORT,
  HC_DYNAMIC_MODULE_EXPORT
} from '../../src/index';

enableFetchMocks();

const emptyHtml = '<html><head></head><body></body></html>';

describe('dynamic import plugin', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    delete (globalThis as Record<string, unknown>)[HC_DYNAMIC_MODULE_EXPORT];
  });

  test('loads relative specifier with htmlRemote and runs in sandbox', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnceIf(
      /\/app\/chunk\.js$/,
      'window.chunkLoaded = 1;'
    );
    const app = new Application({
      name: 't',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const ns = await dyn('./chunk.js');
    expect(Object.keys(ns).length).toBe(0);
    expect((sandbox.contentWindow as any).chunkLoaded).toBe(1);
    expect((window as any).chunkLoaded).toBeUndefined();
  });

  test('htmlRoot rewrites leading slash like getRemoteURLWithHtmlRoot', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnceIf(
      /\/static\/chunk\.js$/,
      'window.rootChunk = 1;'
    );
    const app = new Application({
      name: 't2',
      sandboxOptions: {
        htmlRoot: 'https://cdn.example.com/static',
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    await dyn('/chunk.js');
    expect((sandbox.contentWindow as any).rootChunk).toBe(1);
  });

  test('dedupes concurrent imports for same resolved URL', async () => {
    fetchMock.mockOnce(emptyHtml);
    let loads = 0;
    fetchMock.mockIf(/\/app\/same\.js$/, async () => {
      loads++;
      return `window.dedup = ${loads};`;
    });
    const app = new Application({
      name: 't3',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const [a, b] = await Promise.all([
      dyn('./same.js'),
      dyn('./same.js')
    ]);
    expect(loads).toBe(1);
    expect((sandbox.contentWindow as any).dedup).toBe(1);
    expect(a).toBe(b);
  });

  test('does not runCode after destroy when fetch completes late', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              body: 'window.late = 1;',
              init: { status: 200 }
            });
          }, 30);
        })
    );
    const app = new Application({
      name: 't4',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const p = dyn('./late.js');
    sandbox.destroy();
    const ns = await p;
    expect((sandbox.contentWindow as any).late).toBeUndefined();
    expect(Object.keys(ns).length).toBe(0);
  });

  test('resolves to namespace from __hcDynamicModuleExport', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnceIf(
      /\/app\/lib\.js$/,
      `window.side = 1; ${HC_DYNAMIC_MODULE_EXPORT} = { answer: 42 };`
    );
    const app = new Application({
      name: 't6',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const ns = await dyn('./lib.js');
    expect((ns as any).answer).toBe(42);
    expect((sandbox.contentWindow as any).side).toBe(1);
    expect(
      Reflect.has(sandbox.contentWindow as object, HC_DYNAMIC_MODULE_EXPORT)
    ).toBe(false);
  });

  test('ESM named import/export chain', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnce(
      `import { x } from './dep.js';
export const answer = x + 1;`
    );
    fetchMock.mockOnce('export const x = 41;');
    const app = new Application({
      name: 'esm1',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const ns = await dyn('./main.js');
    expect((ns as any).answer).toBe(42);
  });

  test('ESM default export and import.meta.url', async () => {
    fetchMock.mockOnce(emptyHtml);
    fetchMock.mockOnceIf(
      /\/app\/meta\.js$/,
      'export const u = import.meta.url; export default 7;'
    );
    const app = new Application({
      name: 'esm2',
      sandboxOptions: {
        htmlRemote: 'https://cdn.example.com/app/index.html'
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    const ns = await dyn('./meta.js');
    expect((ns as any).default).toBe(7);
    expect((ns as any).u).toBe(
      'https://cdn.example.com/app/meta.js'
    );
  });

  test('referrerUrl resolves relative specifier', async () => {
    fetchMock.mockOnceIf(
      'https://cdn.example.com/pkg/other/mod.js',
      'window.referrerOk = 1;'
    );
    const app = new Application({
      name: 't5',
      sandboxOptions: {
        htmlString: emptyHtml
      }
    });
    const sandbox = app.activate();
    await sandbox.ready();
    const dyn = (sandbox.contentWindow as any)[HC_DYNAMIC_IMPORT];
    await dyn(
      './mod.js',
      'https://cdn.example.com/pkg/other/entry.js'
    );
    expect((sandbox.contentWindow as any).referrerOk).toBe(1);
  });
});
