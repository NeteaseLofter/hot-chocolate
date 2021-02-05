import { Hook } from './hooks';

import { Sandbox } from './sandbox';
import type { SandboxHooks, SandboxOptions } from './sandbox';

import { defaultPlugins } from '../plugin/default';

export interface ApplicationConfig {
  name: string,
  sandboxOptions?: Pick<
    SandboxOptions,
    Exclude<keyof SandboxOptions, 'onDestroy'>
  >
  [key: string]: any
}

export class Application {
  _plugins: Plugin[];
  config: ApplicationConfig;

  activatedSandbox: Sandbox[];

  constructor (
    config: ApplicationConfig,
    plugins: Plugin[] = []
  ) {
    this._plugins = plugins;
    this.config = config;
    this.activatedSandbox = [];
  }

  activate () {
    const hooks = {
      sandbox: new Hook(),
      window: new Hook(),
      document: new Hook(),
      shadowDom: new Hook(),
    };

    activatePlugins(this, hooks, this._plugins);
    activatePlugins(this, hooks, defaultPlugins);
    const newSandbox = new Sandbox(
      hooks,
      {
        ...this.config.sandboxOptions,
        onDestroy: () => {
          this.removeActivatedSandbox(newSandbox);
        }
      }
    );
    this.activatedSandbox.push(newSandbox);
    return newSandbox;
  }

  findOrActivate () {
    let sandbox;
    if (this.activatedSandbox.length > 0) {
      sandbox = this.activatedSandbox[0];
    } else {
      sandbox = this.activate();
    }
    return sandbox;
  }

  removeActivatedSandbox (sandbox: Sandbox) {
    const index = this.activatedSandbox.findIndex((activatedSandbox) => (activatedSandbox === sandbox))
    if (index > -1) {
      this.activatedSandbox = this.activatedSandbox.slice(0, index)
        .concat(
          this.activatedSandbox.slice(index + 1)
        );
    }
  }

  deactivateAll () {
    this.activatedSandbox.forEach((sandbox) => {
      sandbox.destroy();
    })
  }
}

/**
 * plugin design
 *
 * function (hooks) {
 *  const myHook = new Hook();
 *  hooks.myHook = myHook;
 *  hooks.window.register('get', (target, property, receiver) => {
 *    if (property === 'abc') {
 *      hook.call('myTapName')
 *    }
 *  })
 *  hooks.window.register('set', (target, property, value, receiver) => { xxx })
 *  hooks.window.register('has', (target, property) => { xxx })
 *
 * }
 *
 * function (hooks) {
 *  hooks.myHook.register('get', (target, property, receiver) => {
 *    if (property === 'abc') {
 *      hook.call('myTapName')
 *    }
 *  })
 *  hooks.myHook.register('set', (target, property, value, receiver) => { xxx })
 *  hooks.myHook.register('has', (target, property) => { xxx })
 * }
 */


export interface Plugin {
  (
    hooks: SandboxHooks,
    application: Application,
  ): void;
}

export function activatePlugins (
  application: Application,
  hooks: SandboxHooks,
  plugins: Plugin[],
) {
  plugins.forEach((plugin) => {
    plugin(
      hooks,
      application
    )
  });
}