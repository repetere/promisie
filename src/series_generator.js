'use strict';

var handleMap = function (arr, state) {
  return arr.map(operation => {
    let clone = (typeof state === 'object') ? ((Array.isArray(state)) ? Object.assign([], state) : Object.assign({}, state)) : state;
    if (typeof operation === 'function') return operation(clone);
    else return operation;
  });
};

module.exports = function* series (fns) {
  let current;
  let state;
  while (fns.length) {
    current = fns.shift();
    if (Array.isArray(current)) {
      let resolved = Promise.all(handleMap(current, state))
        .then(result => (Array.isArray(state)) ? state.concat(result) : result)
        .catch(e => Promise.reject(e));
      state = yield resolved;
    }
    else state = yield current(state);
  }
  return state;
};