import { Manager, Sandbox } from '../../src/index';

const manager = new Manager([
  {
    name: 'app1'
  },
  {
    name: 'app2'
  }
])

test('manager apps is correct', () => {
  expect(Object.keys(manager.apps).length).toBe(2);
  expect(Object.keys(manager.apps)).toEqual(
    expect.arrayContaining(['app1', 'app2'])
  );
})

test('manager activate sandbox by name', () => {
  const app1Sandbox = manager.activate('app1');
  expect(app1Sandbox).toEqual(expect.any(Sandbox));
  app1Sandbox?.destroy();
})

test('manager can\'t activate sandbox by un register app name', () => {
  const app1Sandbox = manager.activate('app1-un');
  expect(app1Sandbox).toBeUndefined();
})

test('manager activateAndMount', () => {
  const sandbox = manager.activateAndMount('app1', document.body);
  expect(sandbox?.parent.parentNode).toBe(document.body);
  expect(sandbox?.mounted).toBe(true);
  sandbox?.unmount();
  expect(sandbox?.parent.parentNode).toBeNull();
  expect(sandbox?.mounted).toBe(false);
  sandbox?.destroy();
})

test('deactivateAll app with name param', () => {
  const app1Sandbox1 = manager.activate('app1');
  const app1Sandbox2 = manager.activate('app1');
  const app2Sandbox1 = manager.activate('app2');

  expect(manager.apps.app1.activatedSandbox.length).toBe(2);
  expect(manager.apps.app2.activatedSandbox.length).toBe(1);
  manager.deactivateAll('app1');
  expect(manager.apps.app1.activatedSandbox.length).toBe(0);
  expect(manager.apps.app2.activatedSandbox.length).toBe(1);
  expect(app1Sandbox1?.destroyed).toBe(true);
  expect(app1Sandbox2?.destroyed).toBe(true);
  expect(app2Sandbox1?.destroyed).toBe(false);
  manager.deactivateAll('app2');
  expect(manager.apps.app1.activatedSandbox.length).toBe(0);
  expect(manager.apps.app2.activatedSandbox.length).toBe(0);
})

test('deactivateAll app without name param', () => {
  const app1Sandbox1 = manager.activate('app1');
  const app1Sandbox2 = manager.activate('app1');
  const app2Sandbox1 = manager.activate('app2');

  expect(manager.apps.app1.activatedSandbox.length).toBe(2);
  expect(manager.apps.app2.activatedSandbox.length).toBe(1);
  manager.deactivateAll();
  expect(manager.apps.app1.activatedSandbox.length).toBe(0);
  expect(manager.apps.app2.activatedSandbox.length).toBe(0);
  expect(app1Sandbox1?.destroyed).toBe(true);
  expect(app1Sandbox2?.destroyed).toBe(true);
  expect(app2Sandbox1?.destroyed).toBe(true);
})