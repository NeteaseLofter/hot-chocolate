import { Application } from '../../src/index';

const app = new Application({
  name: 'testApp',
  sandboxOptions: {}
});

const sandbox = app.activate();

test('get target current', () => {
  sandbox.runCode(`
    document.addEventListener('click', (event) => {
      window.testBodyClickTarget = event.target;
    })

    document.body.click();
  `)

  expect((sandbox.contentWindow as any).testBodyClickTarget)
    .toBe(sandbox.defaultShadowHostElement.shadowRoot.querySelector('body'));
});