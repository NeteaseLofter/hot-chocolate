import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { Application } from '../../src/index';

enableFetchMocks();

const app = new Application({
  name: 'testApp',
  sandboxOptions: {}
});

const sandbox = app.activate();

test(':root is replace', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head><style id="test">:root{color:#fff}</style></head><body></body></html>'
    }
  });

  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();

  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  const styleElement = (shadowRoot.querySelector('#test') as HTMLStyleElement);
  expect(styleElement.innerHTML)
    .toBe(':host{color:#fff}');
});

test(':root from link tag is replace', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head><link rel="stylesheet" href="/remote/css"></head><body></body></html>'
    }
  });
  fetchMock.mockOnce(`:root{color:#fff}`);

  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();
  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  const styleElements = (shadowRoot.querySelectorAll('style'));

  // 加载是异步的，等待一会儿
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(styleElements.length)
    .toBe(2);
  expect(styleElements[1].innerHTML)
    .toBe(':host{color:#fff}');
});


test('font-face is replace', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head><style id="test">@font-face{font-family: "Open Sans";src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");}body{color:#fff;}</style></head><body></body></html>',
      htmlRoot: '/remote'
    }
  });

  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();

  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  const styleElement = (shadowRoot.querySelector('#test') as HTMLStyleElement);
  expect(styleElement.innerHTML)
    .toBe('body{color:#fff;}');

  const outStyleElement = (document.querySelector(`style[sandbox-id="${sandbox.id}"]`) as HTMLStyleElement);
  expect(outStyleElement.innerHTML)
    .toBe('@font-face{font-family: "Open Sans";src: url("/remote/fonts/OpenSans-Regular-webfont.woff2") format("woff2");}');
});

test('font-face from link tag is replace', async () => {
  const app = new Application({
    name: 'testApp',
    sandboxOptions: {
      htmlString: '<html><head><link rel="stylesheet" href="/test/abc.css"></head><body></body></html>',
      htmlRoot: '/remote'
    }
  });
  fetchMock.mockOnce(`@font-face{font-family: "Open Sans";src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),url("../fonts/OpenSans-Regular-webfont.woff") format("woff");}body{color:#fff;}`);

  const sandbox = app.activate();
  sandbox.mount(document.body);
  await sandbox.ready();
  const shadowRoot = sandbox.defaultShadowHostElement.shadowRoot;
  const styleElements = (shadowRoot.querySelectorAll('style'));

  // 加载是异步的，等待一会儿
  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(styleElements.length)
    .toBe(2);
  expect(styleElements[1].innerHTML)
  .toBe('body{color:#fff;}');

  const outStyleElement = (document.querySelector(`style[sandbox-id="${sandbox.id}"]`) as HTMLStyleElement);
  expect(outStyleElement.innerHTML)
    .toBe('@font-face{font-family: "Open Sans";src: url("/remote/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),url("/remote/fonts/OpenSans-Regular-webfont.woff") format("woff");}');
});