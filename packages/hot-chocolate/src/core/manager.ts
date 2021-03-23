import { Application } from './application';
import type { ApplicationConfig, Plugin } from './application';

/**
 * @class
 */
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

  /**
   * 替换已经注册到manager的某个应用的配置，也可以用来新增
   * 如果该应用已经有激活的沙箱，会全部销毁
   */
  public updateApp (
    /**
     * @param appName
     * 需要修改的应用名字
     */
    appName: string,
    /**
     * @param {ApplicationConfig} appConfig
     * 应用配置类型：ApplicationConfig
     */
    appConfig: ApplicationConfig
  ) {
    if (this.apps[appName]) {
      this.apps[appName].deactivateAll();
    }

    this.apps[appName] = new Application(
      appConfig,
      this.plugins,
      this
    );
  }

  /**
   * 卸载已注册到manager的某个应用
   * 如果该应用已经有激活的沙箱，会全部销毁
   */
  public uninstallApp (
    /**
     * @param appName
     * 需要卸载的应用名字
     */
    appName: string
  ) {
    if (this.apps[appName]) {
      this.apps[appName].deactivateAll();
      delete this.apps[appName];
    }
  }

  /**
   * 重置所有配置的app
   * 如果该应用已经有激活的沙箱，会全部销毁
   */
  public resetApps (
    /**
     * @param {ApplicationConfig[]} newAppConfigs
     * 应用配置类型：ApplicationConfig
     */
     newAppConfigs: ApplicationConfig[]
  ) {
    const plugins = this.plugins;
    Object.keys(this.apps).forEach((appName) => {
      this.apps[appName].deactivateAll();
      delete this.apps[appName];
    });

    newAppConfigs.forEach((appConfig) => {
      this.apps[appConfig.name] = new Application(appConfig, plugins, this);
    })
  }

  /**
   * 通过 appName 激活某一个应用的沙箱实例
   */
  public activate (
    /**
     * @param appName
     * 对应应用名字
     */
    appName: string
  ) {
    if (this.apps[appName]) {
      return this.apps[appName].activate();
    }
  }

  /**
   * 通过 appName 激活某一个应用的沙箱，并执行挂载到html节点
   */
  public activateAndMount (
    /**
     * @param appName
     * 对应应用名字
     */
    appName: string,
    /**
     * @param appName
     * 需要挂载到的那个html节点
     */
    container: Element
  ) {
    const sandbox = this.activate(appName);
    if (sandbox) {
      sandbox.mount(container);
    }
    return sandbox;
  }

  /**
   * 先通过 appName 查找已激活的沙箱
   * 如果没找到，则激活一个新的
   */
  public findOrActivate (
    /**
     * @param appName
     * 对应应用名字
     */
    appName: string
  ) {
    if (this.apps[appName]) {
      return this.apps[appName].findOrActivate();
    }
  }

  /**
   * 销毁所有已经激活的沙箱
   * 如果传了appName: 销毁该app下的所有已经激活的沙箱
   * 如果没传appName: 销毁所有app下的所有已经激活的沙箱
   */
  public deactivateAll (
    /**
     * @param [appName] -
     * 对应应用名字
     */
    appName?: string
  ) {
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
