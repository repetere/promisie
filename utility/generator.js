'use strict';

var handleMap = function (arr, state) {
  return arr.map(operation => {
    let clone = (typeof state === 'object') ? ((Array.isArray(state)) ? Object.assign([], state) : Object.assign({}, state)) : state;
      console.log({ operation });
    if (typeof operation === 'function') {
      let active = operation(clone);
      if (active instanceof Promise) {
        return active
          .then(resolved => {
            console.log('resolved', resolved);
            return resolved;
          })
          .catch(e => Promise.reject(e));
      }
      return active;
    }
    else return operation;
  });
};

module.exports = function* (fns) {
  let current;
  let state;
  while (fns.length) {
    current = fns.shift();
    if (Array.isArray(current)) {
      state = yield Promise.all(handleMap(current));
    }
    else state = yield current(state);
  }
  console.log(state);
  return state;
};