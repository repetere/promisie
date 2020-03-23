
export default function iterator(
  generator: Generator,
): (state: any, cb: (...args: any[]) => void) => void {
  return function iterate (state: any, cb: (...args: any[]) => void): void {
    let current;
    try {
      current = generator.next(state);
    }
    catch (e) {
      cb(e);
    }
    if (!current) {
      cb(new Error('ERROR: generator returned \'undefined\' value and is not iterable'));
    }
    const { done, value } = current || { done: true, value: null };
    if (!done) {
      if (value && typeof value.then === 'function' && typeof value.catch === 'function') {
        value.then((next: any) => iterate(next, cb), cb);
      } else {
        let timeout = setTimeout(() => {
          iterate(value, cb);
          clearTimeout(timeout);
        }, 0);
      }
    } else {
      cb(null, value);
    }
  };
}