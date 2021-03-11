import type { SandboxHooks } from '../core/sandbox';

export function timeoutPlugin (hooks: SandboxHooks) {
  const setTimeoutManger = new TimeoutManger();
  const setIntervalManger = new TimeoutManger(
    setInterval.bind(window),
    clearInterval.bind(window),
    false
  );

  const requestAnimationFrameManger = new TimeoutManger(
    requestAnimationFrame.bind(window),
    cancelAnimationFrame.bind(window)
  );

  hooks.window.register('get', (end, target, property, receiver, rawWindow) => {
    if (property === 'setTimeout') {
      return end(setTimeoutManger.createSetTimeout());
    }

    if (property === 'clearTimeout') {
      return end(setTimeoutManger.createClearTimeout());
    }

    if (property === 'setInterval') {
      return end(setIntervalManger.createSetTimeout());
    }

    if (property === 'clearInterval') {
      return end(setIntervalManger.createClearTimeout());
    }

    if (property === 'requestAnimationFrame') {
      return end(requestAnimationFrameManger.createSetTimeout());
    }

    if (property === 'cancelAnimationFrame') {
      return end(requestAnimationFrameManger.createClearTimeout());
    }
  });

  hooks.sandbox.register('destroy', (end, sandbox) => {
    setTimeoutManger.destroy();
    setIntervalManger.destroy();
    requestAnimationFrameManger.destroy();
  })
}

class TimeoutManger {

  private _runningTimeouts: number[] = [];
  private _destroyed = false;
  private _setTimeoutAction: Function;
  private _clearTimeoutAction: Function;
  private _autoClearAfterRun: boolean

  constructor (
    setTimeoutAction: Function = setTimeout.bind(window),
    clearTimeoutAction: Function = clearTimeout.bind(window),
    autoClearAfterRun: boolean = true
  ) {
    this._setTimeoutAction = setTimeoutAction;
    this._clearTimeoutAction = clearTimeoutAction;
    this._autoClearAfterRun = autoClearAfterRun;
  }

  createSetTimeout () {
    const _self = this;
    return function (callback: Function, delay: number) {
      let timeout = _self._setTimeoutAction(() => {
        if (_self._destroyed) return;
        if (_self._autoClearAfterRun) {
          _self.clearRunningTimeout(timeout);
        }
        callback();
      }, delay);

      _self._runningTimeouts.push(timeout);
      return timeout;
    }
  }

  clearRunningTimeout (timeout: number) {
    const index = this._runningTimeouts
      .findIndex((runningTimeout) => (runningTimeout === timeout));
    if (index > -1) {
      this._runningTimeouts.splice(index, 1);
    }
  }

  createClearTimeout () {
    const _self = this;
    return function (timeout: number) {
      _self._clearTimeoutAction(timeout);
      _self.clearRunningTimeout(timeout)
    }
  }

  destroy () {
    this._runningTimeouts.forEach((runningTimeout) => {
      this._clearTimeoutAction(runningTimeout);
    })
    this._runningTimeouts = [];
    this._destroyed = true;
  }
}