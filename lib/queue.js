'use strict';

var Promisie;

var insertIntoSingle = function (queue, data) {
  let current = queue.root;
  while (current && current.next) {
    current = current.next;
  }
  current.next = { value: data, next: null };
};

var insertIntoDouble = function (queue, data) {
  let current = queue.root;
  while (current && current.next) {
    current = current.next;
  }
  current.next = { value: data, next: null, previous: current };
};

var spliceQueue = function (current, index) {
  let result = [];
  while (index > 0 && current) {
    index--;
    result.push(current);
    current = current.next;
  }
  return { result, current };
};

var _iterator = function (queue) {
  let index = 0;
  let _queue = queue._queue;
  return function* () {
    let current = _queue.root;
    while (current && !this.paused) {
      if (this.concurrency !== 1) {
        let spliced = spliceQueue(current, (!this.concurrency && this.concurrency !== 'number') ? this.length : this.concurrency);
        let result = spliced.result;
        yield Promisie.map(result, _queue.task)
          .then(mapResult => {
            mapResult.forEach((value, index) => {
              result[index].value = value;
            });
            current = spliced.current;
            return true;
          }, e => Promise.reject(e));  
      }
      else {
        let invoked = queue.task(invoked.value);
        if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
          yield invoked
            .then(result => {
              current.value = result;
              current = current.next;
              return true;
            }, e => Promise.reject(e));
        }
        else {
          current.value = invoked;
          current = current.next;
          yield true;
        }
      }
    }
    return queue;
  }.bind(this);
};

var _enqueue = function () {
  let datas = [...arguments];
  let { queue, type, task } = this._queue();
  datas.forEach(data => {
    this.length++;
    if (!queue.root) queue.root = { value: data, next: null };
    else {
      if (type === 'double') insertIntoDouble(queue, data);
      else insertIntoSingle(queue, data);
    }
  });
  return this;
};

const QUEUE = class Queue {
  constructor (options) {
    let _queue = {
      queue: {},
      type: options.type,
      task: options.task
    };
    _queue.queue[Symbol.iterator] = _iterator.call(this, _queue);
    this.pending = false;
    this.paused = false;
    this.concurrency = options.concurrency;
    this.onDrain = options.drain;
    this.length = 0;
    this._queue = () => _queue;
  }
  enqueue () {
    return _enqueue.apply(this, [...arguments]);
  }
  push () {
    return this.enqueue(...arguments);
  }
  idle () {
    let queue = this._queue().queue;
    return (!queue || !queue.root || !this.pending);
  }
  pause () {
    
  }
  start () {
    
  }
  kill () {
    
  }
};

var initialize = function (promisie) {
  Promisie = promisie;
  return QUEUE;
};
