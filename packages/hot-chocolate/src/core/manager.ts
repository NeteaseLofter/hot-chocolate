import { Application } from './application';
import type { ApplicationConfig, Plugin } from './application';

export class Manager {
  apps: {
    [appName: string]: Application
  };

  plugins: Plugin[];


  constructor (
    appsConfig: ApplicationConfig[],
    plugins: Plugin[] = []
  ) {
    this.apps = {};
    this.plugins = plugins;

    this.resetApps(appsConfig);
  }

  updateApp (
    appName: string,
    appConfig: ApplicationConfig
  ) {
    if (this.apps[appName]) {
      this.apps[appName].deactivateAll();
    }

    this.apps[appName] = new Application(appConfig, this.plugins);
  }

  resetApps (newAppsConfig: ApplicationConfig[]) {
    const plugins = this.plugins;
    Object.keys(this.apps).forEach((appName) => {
      this.apps[appName].deactivateAll();
      delete this.apps[appName];
    });

    newAppsConfig.forEach((appConfig) => {
      this.apps[appConfig.name] = new Application(appConfig, plugins);
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

  findOrActivate (appName: string) {
    if (this.apps[appName]) {
      return this.apps[appName].findOrActivate();
    }
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
