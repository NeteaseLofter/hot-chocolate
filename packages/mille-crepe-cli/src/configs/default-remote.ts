const isTestEnv = process.env.NODE_ENV === 'test';

export const defaultRemote = isTestEnv ? `http://127.0.0.1:9527` : `https://lofter.hz.netease.com/platform`;
export const updateNewVersionUrlPath = '/micro/upload/new-version';
export const getUploadFilesTokenUrlPath = '/micro/upload/token'