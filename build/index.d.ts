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
    [key: string]: ((...args: any[]) => void) | any;
}
export interface PromisifyAllObjectResult {
    [key: string]: (<T>(...args: any[]) => Promisie<T>) | any;
}
export default class Promisie<T = any> extends Promise<T> {
    [key: string]: Function;
    constructor(callback: (resolve: (value?: T | PromiseLike<T>) => void, reject: (value?: T | PromiseLike<T>) => void) => void);
    then<TSuccess = T, TFailure = any>(onfulfilled?: ((value: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined): Promisie<TSuccess>;
    try<TSuccess = T, TFailure = any>(onfulfilled?: ((value: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined): Promisie<TSuccess>;
    spread<TSuccess = T, TFailure = any>(onfulfilled?: ((...args: T[]) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined): Promisie<TSuccess>;
    map<TSuccess = T, TFailure = any>(onfulfilled?: ((datas: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | number, concurrency?: number): Promisie<TSuccess[]>;
    each<TSuccess = T, TFailure = any>(onfulfilled?: ((datas: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | number, concurrency?: number): Promisie<TSuccess[]>;
    settle<TSuccess = T, TFailure = any>(onfulfilled?: ((datas: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined): Promisie<SettleValues<TSuccess>>;
    retry<TSuccess = T, TFailure = any>(onfulfilled?: ((args: T) => any) | null | undefined, onrejected?: ((reason: any) => TFailure | PromiseLike<TFailure>) | null | undefined | RetryOptions, options?: RetryOptions): Promisie<TSuccess>;
    finally<TSuccess = T>(onfulfilled?: (() => any) | null | undefined): Promisie<TSuccess>;
    static promisify(fn: (...args: any[]) => void, _this?: any): <T = any>(...args: any[]) => Promisie<T>;
    static promisifyAll(mod: PromisifyAllObjectParam, _this?: any, options?: PromisifyAllOptions): PromisifyAllObjectResult;
    static series<T = any>(fns: Array<((state: any) => any) | any[]>): Promisie<T>;
    static pipe<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promisie<T>;
    static compose<T = any>(fns: Array<(...args: any[]) => any>): (...args: any[]) => Promisie<T>;
    static map<T = any>(datas: any[], concurrency: any, fn?: (arg: any) => any): Promisie<Array<T>>;
    static each<T = any>(datas: T[], concurrency: any, fn?: (arg: any) => any): Promisie<Array<T>>;
    static parallel<T = any>(fns: {
        [key: string]: any;
    }, args?: any, options?: ParallelOptions): Promisie<{
        [key: string]: any;
    }>;
    static settle<T = any>(fns: any[], concurrency?: number): Promisie<SettleValues>;
    static iterate<T = any>(generator: (arg?: any) => Generator, initial: any): Promisie<T>;
    static doWhilst<T = any>(fn: () => T | Promise<T>, evaluate: (arg: T) => boolean): Promisie<T>;
    static sleep(timeout: number): Promisie<void>;
    static retry<T = any>(fn: () => T | Promise<T>, options?: RetryOptions): Promisie<T | void>;
}
