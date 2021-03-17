// import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

import { Application, AppConfig } from './application';

const fsPromises = fs.promises;

export async function updateApplicationFromConfig (appConfig: AppConfig) {
  const app = new Application(appConfig);
  await app.update();
  return app;
}

export async function createApplicationFromConfigFile (
  configPath: string
) {
  try {
    await fsPromises.access(configPath, fs.constants.R_OK);
  } catch (e) {
    throw new Error(`can't read file: ${configPath}`);
  }
  const appConfig = require(configPath);

  appConfig.rootDir = path.resolve(configPath, '..', appConfig.rootDir)

  console.log('运行路径:', appConfig.rootDir);
  console.log('读取配置:', configPath);

  updateApplicationFromConfig(appConfig);
}