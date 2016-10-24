'use strict';

module.exports = function (fn, options) {
  let Promisie = this;
  let current;
  let isFirst = true;
  let { times, timeout } = options;
  return function* () {
    do {
      times--;
      let invoked = (isFirst || !timeout) ? fn() : (() => {
        return new Promisie((resolve, reject) => {
          let retryTimeout = setTimeout(() => {
            clearTimeout(retryTimeout);
            let retried = fn();
            if (retried && typeof retried.then === 'function' && typeof retried.catch === 'function') retried.then(resolve, reject);
            else resolve(retried);
          }, timeout);
        });
      })();
      if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
        yield invoked
          .then(result => {
            current = result;
            return current;
          }, e => {
            current = { __isRejected: true, e };
            return current;
          });
      }
      else {
        current = invoked;
        yield current;
      }
    }
    while (times && (current && current.__isRejected));
    return current;
  };
};