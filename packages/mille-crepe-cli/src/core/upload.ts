import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

import getUploader from '@winman-f2e/nos-upload';

import {
  defaultRemote,
  getUploadFilesTokenUrlPath
} from '../configs/default-remote';

export interface ObjectType {
  token: string,
  objectKey: string,
  bucket: string,
  endPoint: string,
}

const fsPromises = fs.promises;

export async function upload (file: string, remotePath: string, nosConfig: any, uploadConfig: any) {
  const { uploadByPath } = getUploader(nosConfig);
  const { prefix, otherUploadConfig } = uploadConfig;
  const url = await uploadByPath(file, {
    name: path.basename(remotePath, path.extname(remotePath)),
    ext: path.extname(remotePath),
    prefix: path.join((prefix|| ''), path.dirname(remotePath)).split(path.sep).join('/'),
    ...otherUploadConfig
  });
  return url;
}

export async function getWillUploadFilesInDir (dir: string, fileCheck: (filePath: string) => boolean) {
  const files = await fsPromises.readdir(dir);
  let willUploadFiles: string[] = [];

  await Promise.all(
    files.map(async (filename) => {
      const fileOrDir = path.join(dir, filename);
      const stats = await fsPromises.stat(fileOrDir);
      if (stats.isFile()) {
        if (fileCheck(fileOrDir)) {
          willUploadFiles.push(fileOrDir)
        }
      } else if (stats.isDirectory()) {
        const childWillUploadFiles = await getWillUploadFilesInDir(fileOrDir, fileCheck);
        willUploadFiles = willUploadFiles.concat(childWillUploadFiles);
      }
    })
  )
  return willUploadFiles;
}

/**
 * 凭借密钥和子应用id鉴权，获取待上传文件的nos直传token
 * @param files 待上传的文件完整路径的列表
 * @param rootDir 上传文件的根目录路径（目的是根据跟目录取得其他文件的相对地址作为文件上传的objectKey，比如/js/a.js）
 * @param secret 用户唯一密钥
 * @param appId 想要更新的子应用id
 */
export async function getUploadTokens(
  files:string[],
  rootDir: string,
  secret: string,
  appId: number,
  remote: string = defaultRemote
): Promise<{ fileTokens: {[key: string]: ObjectType}, prefix: string }| undefined> {
  try {
    const url = `${remote}${getUploadFilesTokenUrlPath}`;
    // console.log('url', url);
    const res  = await axios.post(url, {
      files,
      rootDir,
      secret,
      appId,
    })
    if(res.data.code === 0){
      return res.data.data;
    }else{
      console.log('getUploadTokens server error', res.data.msg);
    }
  } catch (error) {
    console.log('getUploadTokens error', error.toString());
  }
}

export async function directlyUpload(filePath: string,  objectData: ObjectType) {
  // console.log(filePath, objectData);
  // let uploadEndpoint = cacheUploadEndpoint;
  const { objectKey, token, bucket, endPoint } = objectData;
  // const fileName = path.basename(filePath);
  // if (!uploadEndpoint) {
  //   const res = await axios.get(`http://lbs-eastchina1.126.net/lbs?version=1.0&bucketname=${bucket}`)
  //   if(res.status === 200){
  //     uploadEndpoint = cacheUploadEndpoint = res.data.upload[0]
  //   }else{
  //     uploadEndpoint = cacheUploadEndpoint = `https://nos.netease.com`
  //   }
  // }
  // console.log('uploadEndpoint', uploadEndpoint);
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('Object', objectKey);
  formData.append('x-nos-token', token);
  try {
    await axios.post(`https://nos.netease.com/${bucket}`, formData, {
      headers: {
        'x-nos-token': token,
        ...formData.getHeaders()
      }
    })
    return `${endPoint}/${objectKey}`
  } catch (error) {
    console.log('directlyUpload error', error);
    return null
  }
}