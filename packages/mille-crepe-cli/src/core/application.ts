import path from 'path';
import { URL } from 'url';

import minimatch from 'minimatch';
import ProgressBar from 'progress';
import chalk from 'chalk';

import { getWillUploadFilesInDir, upload, getUploadTokens, directlyUpload } from './upload';
import { remoteUpdateVersion } from './update-version';
import { getConfigForFile } from './user-config';

export class Application {
  secret: string;
  appId: number;
  entry?: string|(string|RegExp)[];
  html?: string|RegExp;
  remote?: string;
  requestRewrite?: {
    [key: string]: string
  };
  rootDir: string;
  excludes?: string[];
  includes?: string[];

  constructor (appConfig: AppConfig) {
    verifyAppConfig(appConfig);
    console.log('appConfig', appConfig);
    this.secret = appConfig.secret || getConfigForFile('secret');
    this.appId = appConfig.appId;
    this.rootDir = appConfig.rootDir;
    this.entry = appConfig.entry;
    this.html = appConfig.html;
    this.remote = appConfig.remote;
    this.includes = appConfig.includes;
    this.excludes = appConfig.excludes;
    this.requestRewrite = appConfig.requestRewrite || {};
  }

  checkFilePath (filePath: string) {
    let result = true;
    const diffPath = path.relative(this.rootDir, filePath);
    if (this.includes) {
      result = this.includes.some((regPath) => {
        return minimatch(diffPath, regPath)
      })
    }

    if (result && this.excludes) {
      result = this.excludes.every((regPath) => {
        return !minimatch(diffPath, regPath)
      })
    }

    return result;
  }

  findIndexInEntry (
    filePath: string,
    entry?: (string|RegExp)[]|(string|RegExp)
  ) {
    const releaseFilePath = path.relative(this.rootDir, filePath);
    if (Array.isArray(entry)) {
      return entry.findIndex((
        entryReg
      ) => {
        return this.checkFilePathIsEntry(filePath, entryReg);
      })
    } else {
      if (releaseFilePath === entry) {
        return 0;
      }
    }
  }

  checkFilePathIsEntry (filePath: string, entryReg: string|RegExp) {
    const releaseFilePath = path.relative(this.rootDir, filePath);
    if (entryReg instanceof RegExp) {
      return entryReg.test(releaseFilePath);
    } else {
      return minimatch(releaseFilePath, entryReg);
    }
  }

  // { ...this.nos },
  // { prefix: 'fe/lofter-admin' },

  async update () {
    const rootDir = this.rootDir;
    const willUploadFiles = await getWillUploadFilesInDir(
      this.rootDir,
      (filePath: string) => { return this.checkFilePath(filePath); }
    );

    const tokenData = await getUploadTokens(
      willUploadFiles,
      rootDir,
      this.secret,
      this.appId,
      this.remote
    );

    if (!tokenData) {
      throw new Error('上传文件失败');
    }

    const { fileTokens, prefix } = tokenData;

    const willUploadTotal = willUploadFiles.length;

    var bar = new ProgressBar(
      `uploading files :bar :percent :current/:total`,
      {
        complete: chalk.bgGreenBright(' '),
        incomplete: chalk.bgHex('#999')(' '),
        width: 30,
        total: willUploadTotal
      }
    );

    const uploadedUrls = await Promise.all(
      willUploadFiles.map(async (filePath) => {
        const url = await directlyUpload(
          filePath,
          fileTokens[filePath],
        );
        bar.tick();
        return url;
      })
    )

    // console.log('uploadedUrls', uploadedUrls);

    console.log();
    console.log(
      '✅' +
      chalk.bold.green(' 上传资源成功')
    );

    willUploadFiles.forEach((localFile, index) => {
      console.log(
        `📤 ${path.relative(rootDir, localFile)}: ${uploadedUrls[index]}`);
    })

    const entry = this.entry;
    const remoteEntry = new Array(
      Array.isArray(entry) ? entry.length : 1
    );
    let htmlRemote: any = '';

    willUploadFiles.forEach((
      filePath: string,
      index
    ) => {
      let entryIndex = this.findIndexInEntry(filePath, this.entry)
      if (typeof entryIndex === 'number' && entryIndex > -1) {
        remoteEntry[entryIndex] = uploadedUrls[index];
      }

      if (this.html) {
        let isHtmlPath = this.checkFilePathIsEntry(filePath, this.html);
        if (isHtmlPath) {
          htmlRemote = uploadedUrls[index];
        }
      }
    });

    // console.log('remoteEntry', remoteEntry);
    // console.log('htmlRemote', htmlRemote);

    remoteUpdateVersion(
      this.secret,
      this.appId,
      {
        htmlRoot: prefix,
        htmlRemote,
        entry: remoteEntry,
        requestRewrite: this.requestRewrite
      },
      this.remote
    );
  }
}

function verifyAppConfig (appConfig: any) {
  if (!appConfig) {
    throw new Error('app config not found');
  }
  const {
    remote,
    appId,
    entry,
    html,
    rootDir
  } = appConfig;
  if (!appId) {
    throw new Error('app id not found');
  }
  if (!entry && !html) {
    throw new Error('app must has entry or html');
  }
  if (!rootDir) {
    throw new Error('app rootDir not found');
  }
  return true;
}

export interface AppConfig {
  /**
   * 用户唯一密钥
   */
  secret?: string,

  /**
   * 上传地址
   */
  remote?: string,
  /**
   * 想要更新的子应用id
   */
  appId: number,
  /**
   * 需上传文件根目录
   */
  rootDir: string,

  /**
   * 入口文件，相对于rootDir
   */
  entry?: string|(string|RegExp)[],

  /**
   * 上传html模式，html和entry必须至少有一个
   */
  html?: string|RegExp,

  /**
   *  requestTransform {}
   */
  requestRewrite?: {
    [key: string]: string
  },

  /**
   *  不需要上传的文件，相对于rootDir
   */
  excludes?: string[],

  /**
   *  需要上传的文件，相对于rootDir
   */
  includes?: string[],
}