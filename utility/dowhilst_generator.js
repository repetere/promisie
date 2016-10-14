'use strict';

module.exports = function (fn, evaluate) {
  let current;
  return function* () {
    do {
      let invoked = fn();
      if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
        yield invoked
          .then(result => {
            current = result;
            return current;
          }, e => Promise.reject(e));
      }
      else {
        current = invoked;
        yield current;
      }
    }
    while (evaluate(current));
  };
};