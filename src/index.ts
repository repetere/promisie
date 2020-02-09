import utilities from './utilities';
import { SettleValues } from './utilities/settle';

export interface PromisifyAllOptions {
  recursive?: boolean;
  readonly?: boolean;
}

export interface ParallelOptions {
  recursive?: boolean;
  concurrency?: number;
}

export interface RetryOptions {
  times?: number;
  timeout?: number;
}

export interface PromisifyAllObjectParam {
  [key: string]: (...args: any[]) => void | PromisifyAllObjectParam
}

function isNestedPromisifyAllObjectParam(v: any): v is PromisifyAllObjectParam {
  return v && typeof v === 'object';
}

export interface PromisifyAllObjectResult {
  [key: string]: (<T>(...args: any[]) => Promisie<T>) | PromisifyAllObjectResult
}

function setHandlers(success: (arg: any) => any, failure: any) {
  return {
    success,
    failure: (typeof failure === 'function') ? failure : undefined
  };
};

const thenables: { [key: string]: Function } = {
  try<T>(this: Promisie<any>, onSuccess: (arg: any) => any, onFailure?: any): Promisie<T> {
    const { success, failure } = setHandlers(function (data) {
      try {
        return (typeof onSuccess === 'function')
          ? onSuccess(data)
          : Promisie.reject(new TypeError('ERROR: try expects onSuccess handler to be a function'));
      }
      catch (e) {
        return Promisie.reject(e);
      }
    }, onFailure);
    return this.then(success, failure) as Promisie<T>;
  },

  spread<T>(this: Promisie<any>, onSuccess: (...arg: any[]) => any, onFailure?: any): Promisie<T> {
    const { success, failure } = setHandlers(function (data) {
      if (typeof data[Symbol.iterator] !== 'function') {
        return Promisie.reject(new TypeError('ERROR: spread expects input to be iterable'));
      }
      if (typeof onSuccess !== 'function') {
        return Promisie.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
      }
      return onSuccess(...data);
    }, onFailure);
    return this.then(success, failure) as Promisie<T>;
  },

  map<T>(
    this: Promisie<any>,
    onSuccess: (...arg: any[]) => any,
    onFailure?: any,
    concurrency?: number,
  ): Promisie<T> {
    if (typeof onFailure === 'number') {
      concurrency = onFailure;
      onFailure = undefined;
    }
    const { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: map expects input to be an array'));
      }
      if (typeof onSuccess !== 'function') {
        return Promisie.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
      }
      return Promisie.map<T>(data, concurrency, onSuccess);
    }, onFailure);
    return this.then(success, failure) as Promisie<T>;
  },

  each<T>(
    this: Promisie<any>,
    onSuccess: (...arg: any[]) => any,
    onFailure?: any,
    concurrency?: number,
  ): Promisie<T> {
    if (typeof onFailure === 'number') {
      concurrency = onFailure;
      onFailure = undefined;
    }
    const { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: each expects input to be an array'));
      }
      if (typeof onSuccess !== 'function') {
        return Promisie.reject(new TypeError('ERROR: each expects onSuccess handler to be a function'));
      }
      return Promisie.each<T>(data, concurrency, onSuccess);
    }, onFailure);
    return this.then(success, failure) as Promisie<T>;
  },

  settle<T>(
    this: Promisie<any>,
    onSuccess: (arg: any) => any,
    onFailure?: any,
  ): Promisie<SettleValues<T>> {
    let { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: settle expects input to be an array'));
      }
      if (typeof onSuccess !== 'function') {
        return Promisie.reject(new TypeError('ERROR: settle expects onSuccess handler to be a function'));
      }
      let operations = data.map(d => () => onSuccess(d));
      return Promisie.settle(operations);
    }, onFailure);
    return this.then(success, failure) as Promisie<SettleValues<T>>;
  },

  retry<T>(
    this: Promisie<T>,
    onSuccess: (arg: any) => any,
    onFailure?: any,
    options?: RetryOptions,
  ): Promisie<T> {
    if (typeof onFailure === 'object') {
      options = onFailure;
      onFailure = undefined;
    }
    let { success, failure } = setHandlers(function (data) {
      if (typeof onSuccess !== 'function') return Promisie.reject(new TypeError('ERROR: retry expects onSuccess handler to be a function'));
      return Promisie.retry(() => {
        return onSuccess(data);
      }, options);
    }, onFailure);
    return this.then(success, failure) as Promisie<T>;
  },

  finally<T>(this: Promisie<any>, onSuccess: (arg?: any) => any): Promisie<T> {
    let _handler = () => (typeof onSuccess === 'function')
      ? onSuccess()
      : Promisie.reject(new TypeError('ERROR: finally expects handler to be a function'));
    return this.then(_handler, _handler) as Promisie<T>;
  },
}

export default class Promisie<T = any> extends Promise<T> {
  [key: string]: Function;

  constructor(callback: (
    resolve: (value?: T | PromiseLike<T>) => void,
    reject: (value?: T | PromiseLike<T>) => void,
  ) => void) {
    super(callback);
    for (let key in thenables) {
      this[key] = thenables[key].bind(this);
    }
  }

  static promisify(
    fn: (...args: any[]) => void,
    _this?: any
  ): <T = any>(...args: any[]) => Promisie<T> {
    const promisified = function<T>(this: any, ...args: any[]): Promisie<T> {
      return new Promisie((resolve, reject) => {
        args.push(function(err: any, data: any) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
        fn.apply(this, args);
      });
    }
    if (_this) {
      return promisified.bind(_this);
    }
    return promisified;
  }

  static promisifyAll(
    mod: PromisifyAllObjectParam,
    _this?: any,
    options?: PromisifyAllOptions,
  ): PromisifyAllObjectResult {
    const withDefaultOptions = Object.assign({
      readonly: true,
      recursive: false,
    }, options);
    let input: PromisifyAllObjectParam = Object.create(mod);
    if (!withDefaultOptions.readonly) {
      input = Object.assign(input, mod) as PromisifyAllObjectParam;
    } else {
      input = utilities.safeAssign(mod) as PromisifyAllObjectParam;
    }

    const promisified: PromisifyAllObjectResult = {}; 

    Object.keys(input).forEach((key: string): void => {
      if (typeof input[key] === 'function') {
        promisified[`${key}Async`] = (_this)
          ? this.promisify(input[key], _this)
          : this.promisify(input[key]);
      } else if (withDefaultOptions.recursive) {
        const v = input[key];
        if (isNestedPromisifyAllObjectParam(v)) {
          promisified[key] = this.promisifyAll(
            v,
            _this,
            withDefaultOptions,
          );
        }
      }
    });

    return promisified;
  }

  static async series<T = any>(fns: Array<(...args: any[]) => any>): Promise<T> {
    let last;
    for (let i = 0; i < fns.length; i++) {
      last = await fns[i](last);
    }
    return last;
  }

  static pipe<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promise<T> {
    return async function(...args: any[]): Promise<T> {
      const operations = Object.assign([], fns) as Array<(...args: any[]) => any>;
      const first = operations[0];
      operations[0] = function(): any {
        return first(...args);
      }
      return await Promisie.series<T>(fns);
    }
  }

  static compose<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promise<T> {
    return Promisie.pipe<T>(fns.reverse());
  }

  static map<T = any>(datas: any[], concurrency: any, fn?: (arg: any) => any): Promisie<Array<T>> {
    const method = (typeof concurrency === 'function')
      ? concurrency
      : fn;
    return Promisie.promisify(utilities.map)<Array<T>>(method, datas, concurrency);
  }

  static each<T = any>(datas: T[], concurrency: any, fn?: (arg: any) => any): Promisie<Array<T>> {
    return Promisie
      .map<T>(datas, concurrency, fn)
      .then(() => datas) as Promisie<Array<T>>;
  }

  static parallel<T = any>(fns: { [key: string]: any }, args?: any, options: ParallelOptions = {}): Promisie<{ [key: string]: any }> {
    const { recursive = false, concurrency } = options;
    if (recursive) {
      fns = utilities.handleRecursiveParallel<T>(fns);
    }
    return Promisie.promisify(utilities.parallel)<T>(fns, args, concurrency);
  }

  static settle<T = any>(fns: any[], concurrency?: number): Promisie<SettleValues> {
    return Promisie.promisify(utilities.settle)<SettleValues<T>>(fns, concurrency);
  }

  static iterate<T = any>(generator: (arg?: any) => Generator, initial: any): Promisie<T> {
    return Promisie.promisify(utilities.iterator)<T>(generator(initial));
  }

  static doWhilst<T = any>(fn: () => T | Promise<T>, evaluate: (arg: T) => boolean): Promisie<T> {
    return Promisie.iterate<T>(utilities.doWhilst(fn, evaluate), null);
  }

  static sleep(timeout: number): Promisie<void> {
    return new Promisie((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  static retry<T = any>(fn: () => T | Promise<T>, options?: RetryOptions): Promisie<T | void> {
    const { times = 3, timeout = 0 } = options || {};
    return Promisie.iterate<T>(utilities.retry(fn, { times, timeout }), null);
  }
}
