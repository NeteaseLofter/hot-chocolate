import path from 'path';

import program from 'commander';

import { createApplicationFromConfigFile } from '../core/create-application-from-config';
import {
  getUserConfig,
  setUserConfig
} from '../core/user-config';

program
  .version('0.1.9')

program
  .command('upload')
  .description('上传新版本到应用平台')
  .option('--config <configFilePath>', 'config file path', 'lofter-app.json')
  .action((options) => {
    createApplicationFromConfigFile(
      path.resolve(process.cwd(), options.config)
    );
  })

program
  .command('config')
  .description('用户配置')
  .option('--get <configName>', 'get config')
  .option('--set <newConfig>', 'set config')
  .action((options) => {
    if (options.get) {
      getUserConfig(options.get);
    }

    if (options.set) {
      setUserConfig(options.set);
    }
  })


program.parse(process.argv);
