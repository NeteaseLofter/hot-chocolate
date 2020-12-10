import { Application } from '../../src/index';

const app = new Application({
  name: 'window-listener',
  sandboxOptions: {}
});

const sandbox = app.activate();

const consoleSpy = jest
    .spyOn(console, 'assert')
    .mockImplementation(() => {});
let shouldAssertCalledNumber = 0;

test('add window-listener correct', async () => {
  sandbox.runCode(`
    window.testListenerCallback = () => {
      console.assert('custom-event');
    };
    window.addEventListener('custom-event', window.testListenerCallback);
  `);

  window.dispatchEvent(
    new Event('custom-event')
  )
  expect(consoleSpy).toHaveBeenCalledTimes(++shouldAssertCalledNumber);
  expect(consoleSpy).toHaveBeenCalledWith('custom-event');
})

test('dispatchEvent in sandbox correct', async () => {
  sandbox.runCode(`
    window.dispatchEvent(new Event('custom-event'));
  `);

  expect(consoleSpy).toHaveBeenCalledTimes(++shouldAssertCalledNumber);
})

test('remove window-listener correct', async () => {
  sandbox.runCode(`
    window.removeEventListener('custom-event', window.testListenerCallback);
  `);

  window.dispatchEvent(
    new Event('custom-event')
  )
  expect(consoleSpy).toHaveBeenCalledTimes(shouldAssertCalledNumber);
})

test('auto remove window-listener after destroy', async () => {
  sandbox.runCode(`
    window.addEventListener('custom-event', window.testListenerCallback);
  `);

  sandbox.destroy();

  window.dispatchEvent(
    new Event('custom-event')
  )
  expect(consoleSpy).toHaveBeenCalledTimes(shouldAssertCalledNumber);
})