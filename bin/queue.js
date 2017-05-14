'use strint';
const IS_PENDING = Symbol('isPending');
const IS_FULFILLED = Symbol('isFulfulled');
const IS_REJECTED = Symbol('isRejected');
const IS_PAUSED = Symbol('isPaused');

var _fulfill = function (value, resolve) {
  if (typeof this.timeout === 'number') {
    let timeout = setTimeout(() => {
      this.value = value;
      resolve(value);
      clearTimeout(timeout);
    }, this.timeout);
  } else { 
    this.value = value;
    resolve(value);
  }
};

var _reject = function (e, reject) {
  if (typeof this.timeout === 'number') {
    let timeout = setTimeout(() => {
      reject(e);
      clearTimeout(timeout);
    }, this.timeout);
  } else { 
    reject(e);
  }
};

const NODE = class Node {
  constructor (options = {}) {
    this.action = options.action;
    this.timeout = (typeof options.timeout === 'number') ? options.timeout : false;
    this.index = Number(options.index);
    this.value = options.value;
    this[IS_PENDING] = true;
    this[IS_FULFILLED] = false;
    this[IS_REJECTED] = false;
    this._fulfill = _fulfill.bind(this);
    this._reject = _reject.bind(this);
    this.next = null;
  }
  resolve (value) {
    return new Promise((resolve, reject) => {
      try {
        let invoked = (typeof this.action === 'function') ? this.action(value) : this.action;
        if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
          return invoked
            .then(result => this._fulfill(result, resolve))
            .catch(e => this._reject(e, reject));
        } else {
          this._fulfill(invoked, resolve);
        }
      } catch (e) {
       this._reject.call(this, e, reject);
      }
    });
  }
};

var decompress = function (data) {
  let result = [];
  let current = data;
  while (current) {
    result.push(current.value);
    current = current.next;
  }
  return result;
};

var _handleResolve = function (resolve, reject) {
  while (this.active < this.concurrency && this.current) {
    this.active++;
    let current = this.current;
    this.current = current.next;
    current.action = this.action;
    current.resolve(current.value)
      .then(result => {
        if (--this.active === 0 && !this.current) resolve(decompress(this._root));
        else this.resolve(resolve, reject);
      }, e => {
        this[IS_REJECTED] = true;
        reject(e);
      });
  }
};

const QUEUE = class Queue {
  constructor (action, concurrency, timeout, values = []) {
    if (Array.isArray(timeout)) values = timeout;
    this.action = action;
    this.concurrency = (typeof concurrency === 'number') ? concurrency : Infinity;
    this.values = values;
    this.active = 0;
    this.current = null;
    this.timeout = (typeof timeout === 'number')  ? timeout : false;
    this[IS_PAUSED] = false;
    this[IS_REJECTED] = false;
    this._root = null;
    this.length = 0;
  }
  insert () {
    for (let index in arguments) {
      this.length++;
      if (!this._root) this._root = new NODE({ index, value: arguments[index], timeout: this.timeout  });
      else {
        let current = this._root;
        while (current && current.next) current = current.next;
        current.next = new NODE({ index, value: arguments[index], timeout: this.timeout }); 
      }
    }
    this.current = this._root;
    return this;
  }
  resolve (_resolve, _reject) {
    if (!this.current || this[IS_REJECTED] || this[IS_PAUSED]) return null;
    if (_resolve && _reject) {
      _handleResolve.call(this, _resolve, _reject);
    } else {
      return new Promise((resolve, reject) => {
        _handleResolve.call(this, resolve, reject);
      });
    }
  }
};

module.exports = QUEUE;
