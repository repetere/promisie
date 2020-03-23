
function handleMap(arr: any[], state: any) {
  return arr.map(operation => {
    const clone = (typeof state === 'object')
      ? ((Array.isArray(state))
        ? Object.assign([], state)
        : Object.assign({}, state))
      : state;
    if (typeof operation === 'function') return operation(clone);
    else return operation;
  });
};

export default function makeSeriesGenerator<TOut = any>(
  fns: Array<((state: any) => any) | any[]>,
): () => Generator {
  return function* series() {
    let current;
    let state: any;
    while (fns.length) {
      current = fns.shift();
      if (Array.isArray(current)) {
        const resolved = Promise.all(handleMap(current, state))
          .then(result => (Array.isArray(state)) ? state.concat(result) : result)
          .catch(e => Promise.reject(e));
        state = yield resolved;
      }
      else if (current !== undefined) state = yield current(state);
    }
    return state as TOut;
  };
}