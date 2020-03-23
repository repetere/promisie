import Queue, { QueueNode } from './queue';
import Promisie from '../';

interface ParallelOperation {
  operation: any;
  key: string;
}

export default function parallel<T>(
  fns: { [key: string]: T },
  args: any,  
  concurrency: any,
  cb?: (...args: any[]) => void,
) {
  const callback = (typeof concurrency === 'function') ? concurrency : cb;
  const conc = (typeof concurrency === 'number') ? concurrency : undefined;
  const queue = new Queue({
    action: (p: ParallelOperation): any => {
      const { operation, key } = p;
      if (typeof operation === 'function') {
        if (Array.isArray(args)) {
          const params = args as any[];
          return Promise.all([operation(...params), key]);
        }
        return [operation(args), key];
      }
      return [operation, key];
    },
    concurrency: conc,
    decompress: (data?: QueueNode): any => {
      const result: { [key: string]: T } = {};
      let current = data;
      while (current) {
        const [value, key] = current.value as any[];
        result[key as string] = value;
        current = current.next;
      }
      return result;
    },
  });
  const p = queue
    .insert(...Object.keys(fns).map(key => [fns[key], key]))
    .resolve() as Promise<{ [key: string]: T }>;

  return p
    .then(result => callback(null, result))
    .catch(callback);
}

export function handleRecursiveParallel<T>(fns: { [key: string]: any }): { [key: string]: any } {
  return Object.keys(fns).reduce((result: { [key: string]: any }, key: string) => {
    if (fns[key] && typeof fns[key] === 'object') {
      result[key] = () => (
        Promisie.parallel<T>(handleRecursiveParallel(fns[key]))
      );
    } else {
      result[key] = key;
    }
    return result;
  }, {});
}
