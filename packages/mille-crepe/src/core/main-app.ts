import {
  Manager
} from 'hot-chocolate';
import type {
  Plugin
} from 'hot-chocolate';



// script milk-tea-dev-server --config xxx.js
/**
 module.exports = {

}
 */

interface MainAppOptions {
  remote: string,
  plugins: Plugin[]
}

export class MainApp {
  remote: string;
  manager: Manager;

  fetching: null|Promise<any> = null;

  constructor ({
    remote,
    plugins
  }: MainAppOptions) {
    this.remote = remote;

    this.manager = new Manager([], plugins);
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
            try {
              var resource = JSON.parse(app.resource);
            } catch (err) {
              resource = {}
            }
            const entry = resource && resource.entry || [];
            const requestRewrite = resource && resource.requestRewrite || {};
            const js = entry.filter((url: string) => /\.js$/.test(url));
            const css = entry.filter((url: string) => /\.css$/.test(url));
            return {
              name: app.name,
              sandboxOptions: {
                htmlString: resource.htmlString || `<html><body><div id="root"></div></body></html>`,
                resource: {
                  js: js,
                  css: css
                }
              },
              tag: app.tag,
              id: app.id,
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