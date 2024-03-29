import { Application } from '../../src/index';

const app = new Application({
  name: 'testApp',
  sandboxOptions: {}
});

const sandbox = app.activate();

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