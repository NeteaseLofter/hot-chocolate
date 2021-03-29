import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { Application } from '../../src/index';

const app = new Application({
  name: 'testApp',
  sandboxOptions: {}
}, [
  (hooks) => {
    hooks.sandbox.register('beforeInitialization', (end, sandbox) => {
      console.log('beforeInitialization', sandbox);
    });
    hooks.sandbox.register('initialization', (end, sandbox) => {
      console.log('initialization', sandbox);
    });
    hooks.sandbox.register('ready', (end, sandbox) => {
      console.log('ready', sandbox);
    });
    hooks.sandbox.register('destroy', (end, sandbox) => {
      console.log('destroy', sandbox);
    });
    hooks.sandbox.register('mount', (end, sandbox) => {
      console.log('mount', sandbox);
    });
    hooks.sandbox.register('unmount', (end, sandbox) => {
      console.log('unmount', sandbox);
    });

    hooks.sandbox.register('loadResource', (end, sandbox) => {
      console.log('loadResource', sandbox);
      end(async (remoteUrl) => {
        console.log('loadResource callback', remoteUrl);
        const response = await fetch(remoteUrl);
        const scriptText = await response.text();
        console.log('loadResource callback success', scriptText);

        return scriptText;
      })
    });
  }
]);

test('hooks.sandbox', async () => {
  const consoleLogSpy = jest
    .spyOn(console, 'log')
    .mockImplementation(() => {});

  enableFetchMocks();

  let logIndex = 0;
  const sandbox = app.activate();
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'beforeInitialization', sandbox);
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'initialization', sandbox);

  sandbox.mount(document.body);
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'mount', sandbox);

  await sandbox.ready();
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'ready', sandbox);

  fetchMock.mockOnce(`window.remoteCodeRunSuccess=true;`);
  await sandbox.runRemoteCode('/remote-code');
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'loadResource', sandbox);
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'loadResource callback', '/remote-code');
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'loadResource callback success', `window.remoteCodeRunSuccess=true;`);

  sandbox.destroy();
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'unmount', sandbox);
  expect(consoleLogSpy).toHaveBeenNthCalledWith(++logIndex, 'destroy', sandbox);

  jest.restoreAllMocks();
})