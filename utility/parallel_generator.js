'use strict';

module.exports = function (fns, args, result = {}) {
  let index = 0;
  let keys = Object.keys(fns);
  return function* () {
    while (index < keys.length) {
      let currentIndex = index++;
      if (typeof fns[keys[currentIndex]] !== 'function') {
        result[keys[currentIndex]] = fns[keys[currentIndex]];
        yield fns[keys[currentIndex]];
      }
      else {
        let invoked = (Array.isArray(args)) ? fns[keys[currentIndex]](...args) : fns[keys[currentIndex]](args);
        if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
          yield invoked
            .then(value => {
              result[keys[currentIndex]] = value;
              return value;
            }, e => Promise.reject(e));
        }
        else {
          result[keys[currentIndex]] = invoked;
          yield invoked;
        }
      }
    }
  };
};