import os from 'os';
import fs from 'fs';
import path from 'path';

const homedir = os.homedir();

const LOFTER_MICRO_CONFIG_DIR_NAME = '.lofter-micro';
const LOFTER_MICRO_CONFIG_FILE_NAME = 'config';

const configDirPath = path.join(homedir, LOFTER_MICRO_CONFIG_DIR_NAME);
const configFilePath = path.join(configDirPath, LOFTER_MICRO_CONFIG_FILE_NAME);


export function getConfigForFile (configName?: string) {
  let configs = {} as any;

  try {
    const configBuffer = fs.readFileSync(configFilePath);
    const configStr = configBuffer.toString();
    configs = JSON.parse(configStr);
  } catch (e) {}

  if (configName) {
    return configs[configName];
  }
  return configs;
}

function setConfigToFile (configs: any) {
  try {
    fs.accessSync(configDirPath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (e) {
    console.log('will mkdir for config');
    fs.mkdirSync(configDirPath);
  }

  fs.writeFileSync(
    configFilePath,
    JSON.stringify(configs)
  );
}

export function getUserConfig (configName: string) {
  const configs = getConfigForFile();
  console.log(`get config [${configName}]: ${configs[configName]}`);
}

export function setUserConfig (newConfig: string) {
  if (!newConfig) throw new Error('wrong format');
  const [newConfigKey, newConfigValue] = newConfig.split('=');
  if (!newConfigKey || !newConfigValue) throw new Error('wrong format');
  const configs = getConfigForFile();
  configs[newConfigKey] = newConfigValue;
  setConfigToFile(configs);
  console.log(`set config success [${newConfigKey}]: ${newConfigValue}`);
}