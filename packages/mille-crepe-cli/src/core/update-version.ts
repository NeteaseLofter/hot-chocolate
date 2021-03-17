import axios from 'axios';
import chalk from 'chalk';

import {
  defaultRemote,
  updateNewVersionUrlPath
} from '../configs/default-remote';


export async function remoteUpdateVersion (
  secret: string,
  appId: number,
  newVersionData: any,
  remote: string = defaultRemote
) {
  const resource = JSON.stringify(newVersionData);
  const uploadUrl = `${remote}${updateNewVersionUrlPath}`;
  console.log('⚙️ ' + chalk.bold(' 即将更新版本内容为 '), resource);
  try {
    const res = await axios.post(
      uploadUrl,
      resource,
      {
        headers: {
          'Content-type': 'plain/text',
          'lofter-micro-secret': secret,
          'lofter-micro-appid': appId,
        }
      }
    );
    // console.log('res', res.data);
    if (res.data.code !== 0) {
      console.error(res.data.msg);
    } else {
      console.log(
        '✅' +
        chalk.bold.green(` 更新成功, 最新版本为[${res.data.data.version}]`)
      );
    }
  } catch (error) {
    console.error(
      '❌' +
      chalk.bold.red(' 更新到平台失败')
    );
    console.error(error);
  }
}
