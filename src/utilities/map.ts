
import Queue from './queue';

export default function map<T>(
  operation: (arg: any) => any,
  values: any[],
  concurrency: any,
  cb?: (...args: any[]) => void,
) {
  const callback = cb = (typeof concurrency === 'function') ? concurrency : cb;
  const queue = new Queue(operation, concurrency, undefined, values);
  const p = queue.insert(...queue.values).resolve() as Promise<T>
  return p
    .then(result => callback(null, result))
    .catch(callback);
};