
 const IS_PENDING = Symbol('isPending');
 const IS_FULFILLED = Symbol('isFulfulled');
 const IS_REJECTED = Symbol('isRejected');
 const IS_PAUSED = Symbol('isPaused');

 function fulfill(this: QueueNode, value: any, resolve: (value?: any) => void): void {
  if (typeof this.timeout === 'number' && this.timeout > 0) {
    const timeout = setTimeout(() => {
      this.value = value;
      resolve(value);
      clearTimeout(timeout);
    }, this.timeout);
  } else { 
    this.value = value;
    resolve(value);
  }
 }

 function reject(this: QueueNode, e: any, reject: (value?: any) => void): void {
  if (typeof this.timeout === 'number') {
    const timeout = setTimeout(() => {
      reject(e);
      clearTimeout(timeout);
    }, this.timeout);
  } else { 
    reject(e);
  }
 }

export interface QueueNodeOptions {
  action: any;
  timeout?: number;
  index: number;
  value: any;
 }

 export class QueueNode {
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

  constructor(options: QueueNodeOptions) {
    this.action = options.action;
    this.timeout = options.timeout || 0;
    this.index = options.index;
    this.value = options.value;
    this[IS_PENDING] = true;
    this[IS_FULFILLED] = false;
    this[IS_REJECTED] = false;
    this.fulfill = fulfill.bind(this);
    this.reject = reject.bind(this);
    this.next = undefined;
  }

  resolve(value: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const invoked = (typeof this.action === 'function')
          ? this.action(value)
          : this.action;
        if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
          return invoked
            .then((result: any) => this.fulfill(result, resolve))
            .catch((e: any) => this.reject(e, reject));
        } else {
          this.fulfill(invoked, resolve);
        }
      } catch (e) {
        this.reject(e, reject);
      }
    });
  }
 }

function decompress(data?: QueueNode): any {
  let result = [];
  let current = data;
  while (current) {
    result.push(current.value);
    current = current.next;
  }
  return result;
};

function handleResolve(this: Queue, resolve: (value?: any) => void, reject: (value?: any) => void): void {
  while (this.active < this.concurrency && this.current) {
    this.active++;
    let current = this.current;
    this.current = current.next;
    current.action = this.action;
    current.resolve(current.value)
      .then(result => {
        if (--this.active === 0 && !this.current) resolve(decompress(this.root));
        else this.resolve(resolve, reject);
      }, e => {
        this[IS_REJECTED] = true;
        reject(e);
      });
  }
};

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

  constructor(options: QueueOptions) {
    this.action = options.action;
    this.concurrency = options.concurrency || Infinity;
    this.values = options.values || [];
    this.active = 0;
    this.timeout = options.timeout || 0;
    this.current = undefined;
    this[IS_PAUSED] = false;
    this[IS_REJECTED] = false;
    this.root = undefined;
    this.length = 0;
    this.decompress = (options.decompress || decompress).bind(this);
  }

  insert(...args: any[]): Queue {
    for (let i = 0; i < args.length; i++) {
      this.length++;
      if (!this.root) {
        this.root = new QueueNode({
          index: i,
          action: undefined,
          value: args[i],
          timeout: this.timeout,
        });
      } else {
        let current = this.root;
        while (current && current.next) {
          current = current.next;
        }
        current.next = new QueueNode({
          index: i,
          action: undefined,
          value: args[i],
          timeout: this.timeout,
        });
      }
    }
    this.current = this.root;
    return this;
  }

  resolve(resolve?: (value?: any) => void, reject?: (value?: any) => void): null | void | Promise<any> {
    if (!this.current || this[IS_REJECTED] || this[IS_PAUSED]) {
      return null;
    }
    if (resolve && reject) {
      handleResolve.call(this, resolve, reject);
    } else {
      return new Promise((rs, rj) => {
        handleResolve.call(this, rs, rj);
      });
    }
  }
 }
