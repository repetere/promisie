'use strict';

const TIMEOUT = function (Promisie, time = 0) {
  return new Promisie(resolve => {
    let _timeout = setTimeout(function () {
      clearTimeout(_timeout);
      resolve();
    }, time);
  });
};

module.exports = function (fn, options) {
  let Promisie = this;
  let current;
  let isFirst = true;
  let { times, timeout } = options;
  return function* () {
    do {
      times--;
      let invoked = (isFirst || typeof timeout !== 'number' || timeout === 0) ? fn() : (() => {
        return TIMEOUT(Promisie, timeout)
          .then(fn)
          .catch(e => Promise.reject(e));
      })();
      if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
        isFirst = false;
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