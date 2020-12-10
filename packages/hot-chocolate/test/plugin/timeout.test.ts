import { Application } from '../../src/index';

const app = new Application({
  name: 'timeout',
  sandboxOptions: {}
});

test('setTimeout correct', async () => {
  const sandbox = app.activate();
  sandbox.runCode(`setTimeout(() => {window.timeoutData = 1}, 100)`);
  sandbox.runCode(`setInterval(() => {window.intervalData = 2}, 100)`);
  sandbox.runCode(`requestAnimationFrame(() => {window.frameData = 3})`);
  await new Promise((resolve) => setTimeout(() => {
    resolve();
  }, 120));
  expect((sandbox.contentWindow as any).timeoutData).toBe(1);
  expect((sandbox.contentWindow as any).intervalData).toBe(2);
  expect((sandbox.contentWindow as any).frameData).toBe(3);
  sandbox.destroy();
});

test('clearTimeout correct', async () => {
  const sandbox = app.activate();
  sandbox.runCode(`window.timeout = setTimeout(() => {window.timeoutData = 1}, 100)`);
  sandbox.runCode(`window.interval = setInterval(() => {window.intervalData = 2}, 100)`);
  sandbox.runCode(`window.frame = requestAnimationFrame(() => {window.frameData = 3})`);
  await new Promise((resolve) => setTimeout(() => {
    sandbox.runCode(`clearTimeout(window.timeout)`);
    sandbox.runCode(`clearInterval(window.interval)`);
    sandbox.runCode(`cancelAnimationFrame(window.frame)`);
    resolve();
  }, 0));
  await new Promise((resolve) => setTimeout(() => {
    resolve();
  }, 120));
  expect((sandbox.contentWindow as any).timeoutData).toBeUndefined();
  expect((sandbox.contentWindow as any).intervalData).toBeUndefined();
  expect((sandbox.contentWindow as any).frameData).toBeUndefined();
  sandbox.destroy();
});

test('timeout auto clear after destroy correct', async () => {
  const sandbox = app.activate();
  sandbox.runCode(`window.timeout = setTimeout(() => {window.timeoutData = 1}, 100)`);
  sandbox.runCode(`window.interval = setInterval(() => {window.intervalData = 2}, 100)`);
  sandbox.runCode(`window.frame = requestAnimationFrame(() => {window.frameData = 3})`);
  await new Promise((resolve) => setTimeout(() => {
    sandbox.destroy();
    resolve();
  }, 0));
  await new Promise((resolve) => setTimeout(() => {
    resolve();
  }, 120));
  expect((sandbox.contentWindow as any).timeoutData).toBeUndefined();
  expect((sandbox.contentWindow as any).intervalData).toBeUndefined();
  expect((sandbox.contentWindow as any).frameData).toBeUndefined();
});


test('set timeout after destroy is not effective', async () => {
  const sandbox = app.activate();
  sandbox.destroy();
  sandbox.runCode(`window.timeout = setTimeout(() => {window.timeoutData = 1}, 100)`);
  sandbox.runCode(`window.interval = setInterval(() => {window.intervalData = 2}, 100)`);
  sandbox.runCode(`window.frame = requestAnimationFrame(() => {window.frameData = 3})`);
  await new Promise((resolve) => setTimeout(() => {
    resolve();
  }, 120));
  expect((sandbox.contentWindow as any).timeoutData).toBeUndefined();
  expect((sandbox.contentWindow as any).intervalData).toBeUndefined();
  expect((sandbox.contentWindow as any).frameData).toBeUndefined();
});