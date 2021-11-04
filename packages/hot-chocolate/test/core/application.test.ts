import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { Application } from '../../src/index';
import { uniqueId } from '../../src/utils/unique-id';

enableFetchMocks();

const app = new Application({
  name: 'testApp',
  sandboxOptions: {}
});

const sandbox1 = app.activate();
const sandbox2 = app.activate();

describe('sandbox window isolation', () => {
  test('two sandbox is different', () => {
    expect(sandbox1).not.toBe(sandbox2);
  });

  test('two sandbox\'s contentWindow is different', () => {
    expect(sandbox1.contentWindow).not.toBe(sandbox2.contentWindow);
    expect(sandbox1.contentWindow).not.toBe(window);
    expect(sandbox2.contentWindow).not.toBe(window);
  });

  test('custom', () => {
    const ObjectInSandbox = sandbox1.runCode('return navigator');
    expect(ObjectInSandbox).toBe(navigator);
  })

  test('findOrActivate can find', () => {
    expect(app.findOrActivate()).toBe(sandbox1);
  });

  test('set attr on window is isolation', () => {
    (sandbox1.contentWindow as any).test = 'test';
    sandbox1.runCode('window.runCodeTest="test";promotionTest="promotion"');
    expect((sandbox1.contentWindow as any).test).toBe('test');
    expect((sandbox1.contentWindow as any).runCodeTest).toBe('test');
    expect((sandbox1.contentWindow as any).promotionTest).toBe('promotion');
    expect((sandbox2.contentWindow as any).test).not.toBe('test');
    expect((sandbox2.contentWindow as any).runCodeTest).not.toBe('test');
    expect((sandbox2.contentWindow as any).promotionTest).not.toBe('promotion');
    expect((window as any).test).not.toBe('test');
    expect((window as any).runCodeTest).not.toBe('test');
    expect((window as any).promotionTest).not.toBe('promotion');
  })
})

describe('sandbox document isolation', () => {
  test('two sandbox\'s document is different', () => {
    expect(sandbox1.contentWindow.document).not.toBe(sandbox2.contentWindow.document);
    expect(sandbox1.contentWindow.document).not.toBe(document);
    expect(sandbox2.contentWindow.document).not.toBe(document);
  });

  test('set attr on document is isolation', () => {
    (sandbox1.contentWindow.document as any).test = 'test';
    sandbox1.runCode('document.runCodeTest="test"');
    expect((sandbox1.contentWindow.document as any).test).toBe('test');
    expect((sandbox1.contentWindow.document as any).runCodeTest).toBe('test');
    expect((sandbox2.contentWindow.document as any).test).not.toBe('test');
    expect((sandbox2.contentWindow.document as any).runCodeTest).not.toBe('test');
    expect((document as any).test).not.toBe('test');
    expect((document as any).runCodeTest).not.toBe('test');
  });
})

describe('sandbox runCode', () => {
  test('run remote by runRemoteCode code', async () => {
    fetchMock.mockOnce(`window.remoteCodeRunSuccess=true;`);
    expect((sandbox1.contentWindow as any).remoteCodeRunSuccess).toBeUndefined();
    await sandbox1.runRemoteCode('/remote-code');
    expect((sandbox1.contentWindow as any).remoteCodeRunSuccess).toBe(true);
  });

  test('run remote code by loadAndRunCode code', async () => {
    fetchMock.mockOnce(`window.loadAndRunCodeRemoteSuccess=true;`);
    expect((sandbox1.contentWindow as any).loadAndRunCodeRemoteSuccess).toBeUndefined();
    await sandbox1.loadAndRunCode({
      type: 'remote',
      url: '/remote-code'
    });
    expect((sandbox1.contentWindow as any).loadAndRunCodeRemoteSuccess).toBe(true);
  });

  test('run local code by loadAndRunCode code', async () => {
    expect((sandbox1.contentWindow as any).loadAndRunCodeLocalSuccess).toBeUndefined();
    await sandbox1.loadAndRunCode({
      type: 'local',
      content: `window.loadAndRunCodeLocalSuccess=true;`
    });
    expect((sandbox1.contentWindow as any).loadAndRunCodeLocalSuccess).toBe(true);
  });
})


test('deactivateAll by application success', () => {
  expect(app.activatedSandbox.length).toBe(2);
  expect(app.activatedSandbox[0]).toBe(sandbox1);
  expect(app.activatedSandbox[1]).toBe(sandbox2);
  app.deactivateAll();
  expect(app.activatedSandbox.length).toBe(0);
  expect(sandbox1.destroyed).toBe(true);
  expect(sandbox2.destroyed).toBe(true);
});


describe('sandbox mount', () => {
  const sandboxInitStyle = (`<style>html,body {
      position: relative;
      width: 100%;
      height: 100%;
    }
    html {
      overflow: auto;
    }
    table {
      font-size: inherit;
      white-space: inherit;
      line-height: inherit;
      font-weight: inherit;
      font-size: inherit;
      font-style: inherit;
      text-align: inherit;
      border-spacing: inherit;
      font-variant: inherit;
    }
    noscript {
      display: none;
    }
  </style>`).replace(/\s/g, '');

  test('mount & unmount', () => {
    const sandbox = app.activate();
    expect(document.body.innerHTML).toBe('');
    expect(sandbox.mounted).toBe(false);
    expect(sandbox.parent.parentNode).toBeNull();
    sandbox.mount(document.body);
    expect(sandbox.parent.parentNode).toBe(document.body);
    expect(sandbox.mounted).toBe(true);
    sandbox.unmount();
    expect(sandbox.parent.parentNode).toBeNull();
    expect(sandbox.mounted).toBe(false);
    sandbox.destroy();

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    sandbox.mount(document.body);
    expect(consoleSpy).toHaveBeenCalled();
    expect(sandbox.parent.parentNode).toBeNull();
    expect(sandbox.mounted).toBe(false);
  });

  test('mount with html string', async () => {
    const app = new Application({
      name: 'testApp',
      sandboxOptions: {
        htmlString: '<html><head><style>123</style><title>Hello World!</title></head><body><div>1</div><script>window.abc=1;</script><script src="/remote"></script></body></html>'
      }
    });
    fetchMock.mockOnce(`window.eee=2;`);
    const sandbox = app.activate();
    sandbox.mount(document.body);
    await sandbox.ready();
    expect(sandbox.parent.shadowRoot).toBe(sandbox.shadowRoot);
    await sandbox.ready();
    const shadowRoot = sandbox.shadowRoot;
    expect(sandbox.shadowRoot.innerHTML).toBe((
      `<html><head>${sandboxInitStyle}<style>123</style><title>Hello World!</title></head><body><div>1</div></body></html>`
    ));
    expect(shadowRoot.querySelector('title')?.innerHTML).toBe('Hello World!');
    expect(shadowRoot.querySelector('head style')).not.toBeNull();
    expect(shadowRoot.querySelector('body div')?.innerHTML).toBe('1');
    expect((sandbox.contentWindow as any).abc).toBe(1);
    expect((sandbox.contentWindow as any).eee).toBe(2);
  });

  test('mount with html remote', async () => {
    const app = new Application({
      name: 'testApp',
      sandboxOptions: {
        htmlRemote: '/remote',
        htmlRoot: '/htmlRoot'
      }
    });
    fetchMock.mockOnce(`<html><head><style>123</style><title>Hello World!</title><link href="/remote-link" rel="stylesheet" /></head><body><div>1</div><script>window.abc=1;</script></body></html>`);
    const sandbox = app.activate();
    sandbox.mount(document.body);
    await sandbox.ready();
    expect(sandbox.parent.shadowRoot).toBe(sandbox.shadowRoot);
    const shadowRoot = sandbox.shadowRoot;
    expect(sandbox.shadowRoot.innerHTML).toBe((
      `<html><head>${sandboxInitStyle}<style>123</style><title>Hello World!</title><style></style><sandbox-fake-link-${uniqueId} href="/htmlRoot/remote-link" rel="stylesheet"></sandbox-fake-link-${uniqueId}></head><body><div>1</div></body></html>`
    ));
    expect(shadowRoot.querySelector('title')?.innerHTML).toBe('Hello World!');
    expect(shadowRoot.querySelector('head style')).not.toBeNull();
    expect(shadowRoot.querySelector('body div')?.innerHTML).toBe('1');
    expect((sandbox.contentWindow as any).abc).toBe(1);
  });
})
