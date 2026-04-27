import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { Application } from '../../src/index';

enableFetchMocks();

test('document activeElement is current', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head></head><body><input /></body></html>'
    }
  });

  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();

  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  const input = (shadowRoot.querySelector('body input') as HTMLInputElement);
  input.focus();
  expect(sandbox.contentWindow.document.activeElement)
    .toBe(input);
});

test('document ownerDocument is isolation', () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {}
  });
  const sandbox = app.activate();
  expect(sandbox.contentWindow.document.documentElement.ownerDocument)
    .not.toBe(document);
  expect(sandbox.contentWindow.document.documentElement.ownerDocument)
    .toBe(sandbox.contentWindow.document);
  expect(sandbox.contentWindow.document.head.ownerDocument)
    .not.toBe(document);
  expect(sandbox.contentWindow.document.head.ownerDocument)
    .toBe(sandbox.contentWindow.document);
  expect(sandbox.contentWindow.document.body.ownerDocument)
    .not.toBe(document);
  expect(sandbox.contentWindow.document.body.ownerDocument)
    .toBe(sandbox.contentWindow.document);
  expect(sandbox.contentWindow.document.createElement('div').ownerDocument)
    .not.toBe(document);
  expect(sandbox.contentWindow.document.createElement('div').ownerDocument)
    .toBe(sandbox.contentWindow.document);
  expect(sandbox.runCode(`return document.createElement('div')`).ownerDocument)
    .not.toBe(document);
  expect(sandbox.runCode(`return document.createElement('div')`).ownerDocument)
    .toBe(sandbox.contentWindow.document);
});

test('ownerDocument with innerHTML', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head></head><body><div>1</div></body></html>'
    }
  });
  const sandbox = app.activate();
  sandbox.mount(document.body);
  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  await sandbox.ready();
  expect(shadowRoot.querySelector('body div')?.ownerDocument)
    .toBe(sandbox.contentWindow.document);
});

test('document.getElementsByTagName', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: `
        <html><head></head><body>
        <script>window.a=1</script>
        <script src="/a"></script>
      </body></html>`
    }
  });
  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();
  expect(
    sandbox.contentWindow.document.getElementsByTagName('script').length
  ).toBe(2);
  expect(
    (sandbox.contentWindow.window as any).a
  ).toBe(1)
  expect(
    sandbox.contentWindow.document.getElementsByTagName('script')[0].innerHTML
  ).toBe('window.a=1')
  expect(
    sandbox.contentWindow.document.getElementsByTagName('script')[1].src
  ).toBe('/a')
});

describe('script type=module', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('loads src via __hcDynamicImport (not classic remote script) and runs after ready', async () => {
    fetchMock.mockIf(
      (req: { url: string }) =>
        /esm-fake\.js(\?.*)?$/.test(req.url) || /dep\.js(\?.*)?$/.test(req.url),
      (req: { url: string }) => {
        if (/esm-fake\.js(\?.*)?$/.test(req.url)) {
          // 使用绝对地址，避免与 url.resolve 在 entry 文件路径上的组合差异
          return Promise.resolve(
            `import { x } from 'https://cdn.example.com/dep.js';
window.__esmFromModuleImport = x;`
          );
        }
        return Promise.resolve('export const x = 41;');
      }
    );
    const app = new Application({
      name: 'testAppTypeModule',
      sandboxOptions: {
        // htmlRoot makes /esm-fake.js resolve to an absolute URL (Node fetch requires it).
        htmlRoot: 'https://cdn.example.com',
        htmlString:
          '<html><head></head><body><script type="module" src="/esm-fake.js"></script></body></html>'
      }
    });
    const sandbox = app.activate();
    sandbox.mount(document.body);
    await sandbox.ready();
    // 队列里对 local 脚本的 runCode 不返回 `__hcDynamicImport` 的 Promise，ready 可能在模块跑完前 resolve
    for (let i = 0; i < 100; i++) {
      if ((sandbox.contentWindow as any).__esmFromModuleImport === 41) {
        break;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 5));
    }
    expect((sandbox.contentWindow as any).__esmFromModuleImport).toBe(41);
  });
});