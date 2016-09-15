'use strict';

module.exports = function* (fns) {
  let current;
  let state;
  while (fns.length) {
    current = fns.shift();
    if (!state) state = yield current();
    else state = yield current(state);
  }
  return state;
};