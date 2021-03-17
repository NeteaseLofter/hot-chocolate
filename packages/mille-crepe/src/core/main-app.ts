import {
  Manager
} from 'hot-chocolate';
import type {
  Plugin
} from 'hot-chocolate';

import {
  presetPlugins
} from './preset'


interface MainAppOptions {
  remote: string,
  plugins?: Plugin[]
}

export class MainApp {
  remote: string;

  manager: Manager;

  fetching: null|Promise<any> = null;

  constructor ({
    remote,
    plugins = []
  }: MainAppOptions) {
    this.remote = remote;

    this.manager = new Manager([], [
      ...presetPlugins,
      ...plugins
    ]);
    this.syncApps();
  }

  async fetchApps () {
    const response = await fetch(this.remote);
    const json: any = await response.json();
    return json.data;
  }

  async syncApps () {
    if (!this.fetching) {
      this.fetching = this.fetchApps()
        .then(({ apps }) => {
          return apps.map((app: any) => {
            let resource = {} as any;
            try {
              resource = JSON.parse(app.resource);
            } catch (err) {}
            const entry = resource.entry || [];
            const htmlRemote = resource.htmlRemote || '';

            const sandboxOptions: any = {
              htmlString: resource.htmlString || '<html><body><div id="root"></div></body></html>',
            };
            if (htmlRemote) {
              sandboxOptions.htmlRemote = htmlRemote;
              sandboxOptions.htmlRoot = resource.htmlRoot || '';
            } else {
              const js = entry.filter((url: string) => /\.js$/.test(url));
              const css = entry.filter((url: string) => /\.css$/.test(url));
              sandboxOptions.resource = {
                js,
                css
              }
            }
            return {
              name: app.appName,
              sandboxOptions,
              description: app.remark,
              activeRule: app.activeRule,
              id: app.id,
              originText: app.resource,
              origin: resource
            };
          });
        })
        .then((apps: Parameters<Manager['resetApps']>[0]) => {
          this.manager.resetApps(apps);
          return this;
        });
    }
    return this.fetching;
  }
}

export async function createMainAppAsync (options: MainAppOptions) {
  const mainApp = new MainApp(options);
  await mainApp.syncApps();
  return mainApp;
}