import {
  DISPATCH_IMPORT_KEY
} from './contents';

export const dispatchPluginImport = ((window as any)[DISPATCH_IMPORT_KEY])
  || (async () => ({}));
