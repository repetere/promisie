declare const IS_PENDING: unique symbol;
declare const IS_FULFILLED: unique symbol;
declare const IS_REJECTED: unique symbol;
declare const IS_PAUSED: unique symbol;
export interface QueueNodeOptions {
    action: any;
    timeout?: number;
    index: number;
    value: any;
}
export declare class QueueNode {
    action: any;
    timeout?: number;
    index: number;
    value: any;
    fulfill: (this: QueueNode, value: any, resolve: (value?: any) => void) => void;
    reject: (this: QueueNode, e: any, reject: (value?: any) => void) => void;
    next?: QueueNode;
    [IS_PENDING]: boolean;
    [IS_FULFILLED]: boolean;
    [IS_REJECTED]: boolean;
    constructor(options: QueueNodeOptions);
    resolve(value: any): Promise<any>;
}
export interface QueueOptions {
    action: any;
    concurrency?: number;
    timeout?: number;
    values?: any[];
    decompress?: (data?: QueueNode) => any;
}
export default class Queue {
    action: any;
    concurrency: number;
    timeout: number;
    values: any[];
    active: number;
    current?: QueueNode;
    [IS_PAUSED]: boolean;
    [IS_REJECTED]: boolean;
    root?: QueueNode;
    length: number;
    decompress: (data?: QueueNode) => void;
    constructor(options: QueueOptions);
    insert(...args: any[]): Queue;
    resolve(resolve?: (value?: any) => void, reject?: (value?: any) => void): null | void | Promise<any>;
}
export {};
