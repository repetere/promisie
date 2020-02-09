
export default function makeDoWhilstGenerator<T>(
  fn: () => any,
  evaluate: (val: T) => boolean,
): () => Generator {
  let current: T;
  return function* doWhilst(): Generator {
    do {
      const invoked = fn();
      if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
        yield invoked
          .then((result: T) => {
            current = result;
            return current;
          }, (e: Error) => Promise.reject(e));
      }
      else {
        current = invoked as T;
        yield current;
      }
    }
    while (evaluate(current));
  };
}