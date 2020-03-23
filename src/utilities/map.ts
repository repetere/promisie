
import Queue from './queue';

export default function map<T>(
  operation: (arg: any) => any,
  values: any[],
  concurrency: any,
  cb?: (...args: any[]) => void,
) {
  const callback = (typeof concurrency === 'function') ? concurrency : cb;
  const conc = (typeof concurrency === 'number') ? concurrency : undefined;
  const queue = new Queue({
    action: operation,
    concurrency: conc,
  });
  const p = queue.insert(...values).resolve() as Promise<Array<T>>
  return p
    .then(result => callback(null, result))
    .catch(callback);
};