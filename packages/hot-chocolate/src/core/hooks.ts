

export class Hook<T extends {[name: string]: { args: any[], result?: any}} = any> {
  protected _registeredHooks = {} as {
    [propsName: string]: any;
  };

  register<K extends keyof T> (
    name: K,
    callback: (
      end: (result: T[K]['result']) => void,
      ...args: (T[K]['args'])
    ) => void
  ) {
    let namedRegisteredHooks = this._registeredHooks[name as string];
    if (!namedRegisteredHooks) {
      namedRegisteredHooks = this._registeredHooks[name as string] = [];
    }

    namedRegisteredHooks.push(callback);
  }

  evoke (
    name: keyof T,
    ...args: T[typeof name]['args']
  ): {
    isEnd: boolean,
    result: T[typeof name]['result']
  } {
    const namedRegisteredHooks = this._registeredHooks[name as string];
    let isEnd = false;
    let result;
    if (namedRegisteredHooks) {
      const end = (endResult: any) => {
        if (isEnd) {
          console.error('end 不能重复调用');
          return;
        }
        isEnd = true;
        result = endResult;
      }
      namedRegisteredHooks.forEach((hookCallback: any) => {
        if (!isEnd) {
          hookCallback(end, ...args);
        }
      })
    }
    return {
      isEnd,
      result
    };
  }
}
