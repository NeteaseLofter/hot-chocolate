

export class Hook<
T extends {[name: string]: { args: any[], result?: any}} = any
> {
  protected _registeredHooks = {} as {
    [propsName: string]: any;
  };

  register<
    K extends keyof T,
    R = T[K]['result'],
    End = {
      (result: R): void;
      decorator: (decorator: (result: R) => R) => void;
    }
  > (
    name: K,
    callback: (
      end: End,
      ...args: (T[K]['args'])
    ) => void
  ) {
    let namedRegisteredHooks = this._registeredHooks[name as string];
    if (!namedRegisteredHooks) {
      namedRegisteredHooks = this._registeredHooks[name as string] = [];
    }

    namedRegisteredHooks.push(callback);
  }

  evoke<
      K extends keyof T,
      R = T[K]['result'],
      End = {
        (result: R): void;
        decorator: (decorator: (result: R) => R) => void;
      }
    > (
    name: K,
    ...args: T[typeof name]['args']
  ): {
    isEnd: boolean,
    result: T[typeof name]['result']
  } {
    const namedRegisteredHooks = this._registeredHooks[name as string];
    let isEnd = false;
    let result;
    let decorator: (result: R) => R;
    if (namedRegisteredHooks) {
      const end: End = ((endResult: R) => {
        if (isEnd) {
          console.error('end 不能重复调用');
          return;
        }
        isEnd = true;
        result = decorator ? decorator(endResult) : endResult;
      }) as End;
      (end as any).decorator = (newDecorator: any) => {
        decorator = newDecorator;
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
