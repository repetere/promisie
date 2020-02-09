
function timeout(time = 0): Promise<void> {
  return new Promise(resolve => {
    let _timeout = setTimeout(function () {
      clearTimeout(_timeout);
      resolve();
    }, time);
  });
};

export default function makeRetryGenerator<T>(
  fn: () => any,
  options: { times: number, timeout?: number }
): () => Generator {
  let current: { __isRejected?: boolean, e: Error } | T;
  let isFirst = true;
  let { times, timeout: to } = options;
  return function* retry(): Generator {
    do {
      times--;
      let invoked = (isFirst || typeof to !== 'number' || to === 0) ? fn() : (() => {
        return timeout(to)
          .then(fn)
          .catch(e => Promise.reject(e));
      })();
      isFirst = false;
      if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
        yield invoked
          .then((result: T) => {
            current = result;
            return current;
          }, (e: Error) => {
            current = { __isRejected: true, e };
            return current;
          });
      }
      else {
        current = invoked;
        yield current;
      }
    }
    while (
      times
      && (
        current
        && Object.hasOwnProperty.call(current, '__isRejected')
      )
    );
    return current;
  };
};