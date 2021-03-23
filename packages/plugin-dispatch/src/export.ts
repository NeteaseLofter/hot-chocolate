import {
  DISPATCH_MODULE_KEY,
  DISPATCH_MODULE_EXPORTS_KEY
} from './contents';

let dispatchPluginExports = {};
let dispatchPluginModule = {
  [DISPATCH_MODULE_EXPORTS_KEY]: dispatchPluginExports
};

if (
  (window as any)[DISPATCH_MODULE_KEY]
  && (window as any)[DISPATCH_MODULE_KEY][DISPATCH_MODULE_EXPORTS_KEY]
) {
  dispatchPluginModule = (window as any)[DISPATCH_MODULE_KEY];
  dispatchPluginExports = (window as any)[DISPATCH_MODULE_KEY][DISPATCH_MODULE_EXPORTS_KEY];
}

export {
  dispatchPluginModule,
  dispatchPluginExports
}