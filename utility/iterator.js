'use strict';

var iterator = function (generator, cb) {
  let _transform;
  return function iterate (state) {
    let current;
    try {
      current = generator.next(state);
    }
    catch (e) {
      cb(e);
    }
    let { done, value } = current;
    if (!done) {
      if (value && typeof value.then === 'function' && typeof value.catch === 'function') value.then(iterate, cb);
      else {
        let timeout = setTimeout(() => {
          iterate(value);
          clearTimeout(timeout);
        }, 0);
      }
    }
    else if (!current) cb(new Error('ERROR: generator returned \'undefined\' value and is not iterable'));
    else cb(null, value);
  };
};

module.exports = iterator;
