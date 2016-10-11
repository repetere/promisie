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
    if (current && !current.done) {
      if (current.value && typeof current.value.then === 'function' && typeof current.value.catch === 'function') current.value.then(iterate, cb);
      else {
        let timeout = setTimeout(() => {
          iterate(current.value);
          clearTimeout(timeout);
        }, 0);
      }
    }
    else if (!current) cb(new Error('ERROR: generator returned \'undefined\' value and is not iterable'));
    else cb(null, current.value);
  };
};

module.exports = iterator;
