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
  [key: string]: ((...args: any[]) => void) | any
}

function isNestedPromisifyAllObjectParam(v: any): v is PromisifyAllObjectParam {
  return v && typeof v === 'object';
}

export interface PromisifyAllObjectResult {
  [key: string]: (<T>(...args: any[]) => Promisie<T>) | any
}

function setHandlers(success: (arg: any) => any, failure: any) {
  return {
    success,
    failure: (typeof failure === 'function') ? failure : undefined
  };
};

export default class Promisie<T = any> extends Promise<T> {
  [key: string]: Function;

  constructor(callback: (
    resolve: (value?: T | PromiseLike<T>) => void,
    reject: (value?: T | PromiseLike<T>) => void,
  ) => void) {
    super(callback);
  }

  then<TSuccess = T, TFailure = any>(
    onfulfilled?: ((value: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined,
  ): Promisie<TSuccess> {
    return super.then(onfulfilled, onrejected) as Promisie<TSuccess>
  }

  try<TSuccess = T, TFailure = any>(
    onfulfilled?: ((value: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined,
  ): Promisie<TSuccess> {
    const { success, failure } = setHandlers(function (data) {
      try {
        return (typeof onfulfilled === 'function')
          ? onfulfilled(data)
          : Promisie.reject(new TypeError('ERROR: try expects onSuccess handler to be a function'));
      }
      catch (e) {
        return Promisie.reject(e);
      }
    }, onrejected);
    return this.then(success, failure) as Promisie<TSuccess>;
  }

  spread<TSuccess = T, TFailure = any>(
    onfulfilled?: ((...args: T[]) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined,
  ): Promisie<TSuccess> {
    const { success, failure } = setHandlers(function (data) {
      if (typeof data[Symbol.iterator] !== 'function') {
        return Promisie.reject(new TypeError('ERROR: spread expects input to be iterable'));
      }
      if (typeof onfulfilled !== 'function') {
        return Promisie.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
      }
      return onfulfilled(...data);
    }, onrejected);
    return this.then(success, failure) as Promisie<TSuccess>;
  }

  map<TSuccess = T, TFailure = any>(
    onfulfilled?: ((datas: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | number,
    concurrency?: number,
  ): Promisie<TSuccess[]> {
    if (typeof onrejected === 'number') {
      concurrency = onrejected;
      onrejected = undefined;
    }
    const { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: map expects input to be an array'));
      }
      if (typeof onfulfilled !== 'function') {
        return Promisie.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
      }
      return Promisie.map<TSuccess>(data, concurrency, onfulfilled);
    }, onrejected);
    return this.then(success, failure) as Promisie<TSuccess[]>;
  }

  each<TSuccess = T, TFailure = any>(
    onfulfilled?: ((datas: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | number,
    concurrency?: number,
  ): Promisie<TSuccess[]> {
    if (typeof onrejected === 'number') {
      concurrency = onrejected;
      onrejected = undefined;
    }
    const { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: each expects input to be an array'));
      }
      if (typeof onfulfilled !== 'function') {
        return Promisie.reject(new TypeError('ERROR: each expects onSuccess handler to be a function'));
      }
      return Promisie.each<TSuccess>(data, concurrency, onfulfilled);
    }, onrejected);
    return this.then(success, failure) as Promisie<TSuccess[]>;
  }

  settle<TSuccess = T, TFailure = any>(
    onfulfilled?: ((datas: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined,
  ): Promisie<SettleValues<TSuccess>> {
    const { success, failure } = setHandlers(function (data) {
      if (!Array.isArray(data)) {
        return Promisie.reject(new TypeError('ERROR: settle expects input to be an array'));
      }
      if (typeof onfulfilled !== 'function') {
        return Promisie.reject(new TypeError('ERROR: settle expects onSuccess handler to be a function'));
      }
      const operations = data.map(d => () => onfulfilled(d));
      return Promisie.settle<TSuccess>(operations);
    }, onrejected);
    return this.then(success, failure) as Promisie<SettleValues<TSuccess>>;
  }

  retry<TSuccess = T, TFailure = any>(
    onfulfilled?: ((args: T) => any) | null | undefined,
    onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | RetryOptions,
    options?: RetryOptions,
  ): Promisie<TSuccess> {
    if (onrejected && typeof onrejected === 'object') {
      options = onrejected;
      onrejected = undefined;
    }
    const { success, failure } = setHandlers(function (data) {
      if (typeof onfulfilled !== 'function') return Promisie.reject(new TypeError('ERROR: retry expects onSuccess handler to be a function'));
      return Promisie.retry<TSuccess>(() => {
        return onfulfilled(data);
      }, options);
    }, onrejected);
    return this.then(success, failure) as Promisie<TSuccess>;
  }

  finally<TSuccess = T>(onfulfilled?: (() => any) | null | undefined): Promisie<TSuccess> {
    const _handler = () => (typeof onfulfilled === 'function')
      ? onfulfilled()
      : Promisie.reject(new TypeError('ERROR: finally expects handler to be a function'));
    return this.then(_handler, _handler) as Promisie<TSuccess>;
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

  static series<T = any>(fns: Array<((state: any) => any) | any[]>): Promisie<T> {
    return Promisie.iterate<T>(utilities.series(fns), null);
  }

  static pipe<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promisie<T> {
    return function(...args: any[]): Promisie<T> {
      const operations = Object.assign([], fns) as Array<(...args: any[]) => any>;
      const first = operations[0];
      operations[0] = function(): any {
        return first(...args);
      }
      return Promisie.series<T>(operations);
    }
  }

  static compose<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promisie<T> {
    return Promisie.pipe<T>(fns.reverse());
  }

  static map<T = any>(datas: any[], concurrency: any, fn?: (arg: any) => any): Promisie<Array<T>> {
    const method = (typeof concurrency === 'function')
      ? concurrency
      : fn;
    if (typeof concurrency !== 'number') {
      concurrency = 1;
    }
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
    const iterator = utilities.iterator(generator(initial));
    return Promisie.promisify(iterator)<T>(initial);
  }

  static doWhilst<T = any>(fn: () => T | Promise<T>, evaluate: (arg: T) => boolean): Promisie<T> {
    return Promisie.iterate<T>(utilities.doWhilst<T>(fn, evaluate), null);
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
    return Promisie.iterate(utilities.retry<T>(fn, { times, timeout }), null)
      .then(result => {
        const { __isRejected, e, value } = result as { __isRejected?: boolean, e: Error | null, value: T | null };
        if (__isRejected) {
          return Promisie.reject(e);
        }
        return Promisie.resolve(value);
      });
  }
}
