'use strict';

var Promisie;

var iterator = function (generator, cb) {
  return function iterate(state) {
    let current;
    try {
      current = generator.next(state);
    }
    catch (e) {
      cb(e);
    }
    if (current && !current.done) {
      if (current.value instanceof Promise || current.value instanceof Promisie) current.value.then(iterate, cb);
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

module.exports = function (promisie) {
  Promisie = promisie;
  return iterator;
};