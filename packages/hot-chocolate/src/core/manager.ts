import { Application } from './application';
import type { ApplicationConfig, Plugin } from './application';

export class Manager {
  apps: {
    [appName: string]: Application
  };


  constructor (
    appsConfig: ApplicationConfig[],
    plugins: Plugin[] = []
  ) {
    this.apps = {};

    appsConfig.forEach((appConfig) => {
      const app = new Application(appConfig, plugins);
      this.apps[appConfig.name] = app;
    })
  }

  activate (appName: string) {
    if (this.apps[appName]) {
      return this.apps[appName].activate();
    }
  }

  activateAndMount (appName: string, container: Element) {
    const sandbox = this.activate(appName);
    if (sandbox) {
      sandbox.mount(container);
    }
    return sandbox;
  }

  deactivateAll (appName?: string) {
    if (appName) {
      if (this.apps[appName]) {
        this.apps[appName].deactivateAll();
      }
    } else {
      Object.keys(this.apps).forEach((appName) => {
        this.apps[appName].deactivateAll();
      })
    }
  }
}
