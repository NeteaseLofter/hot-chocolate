import {
  Manager
} from 'hot-chocolate';



// script milk-tea-dev-server --config xxx.js
/**
 module.exports = {

}
 */

interface MainAppOptions {
  appId: number,
  remote: string
}

export class MainApp {
  appId: number;
  remote: string;
  manager: Manager;

  fetching: null|Promise<any> = null;

  constructor ({
    appId,
    remote
  }: MainAppOptions) {
    this.appId = appId;
    this.remote = remote;

    this.manager = new Manager([]);
  }

  async fetch () {
    return await {
      mainId: 1231,
      subApp: [
        {
          name: 'app1'
        }
      ]
    };
  }

  async ready () {
    if (!this.fetching) {
      this.fetching = this.fetch()
        .then(({ subApp }) => {
          this.manager.resetApps(subApp);
          return this;
        });
    }
    return this.fetching;
  }
}

export async function createMainAppAsync (options: MainAppOptions) {
  const mainApp = new MainApp(options);
  return mainApp.ready();
}