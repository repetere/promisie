import Queue, { QueueNode } from './queue';

export interface SettleValues<T = any> {
  fulfilled: Fulfilled<T>[];
  rejected: Rejected[];
}

export interface Fulfilled<T = any> {
  value: T;
  status: 'fulfilled';
}

export interface Rejected {
  value: Error;
  status: 'rejected';
}

export default function settle<T = any>(
  fns: any[],
  concurrency: any,
  cb?: (...args: any[]) => void,
) {
  const callback = (typeof concurrency === 'function') ? concurrency : cb;
  const conc = (typeof concurrency === 'number') ? concurrency : undefined;
  const fulfilled: Fulfilled<T>[] = [];
  const rejected: Rejected[] = [];
  const queue = new Queue({
    action(operation: any): any {
      if (typeof operation === 'function') {
        try {
          const invoked = operation();
          if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
            invoked
              .then((result: any) => {
                fulfilled.push({ value: result, status: 'fulfilled' });
              }, (err: any) => {
                rejected.push({ value: err, status: 'rejected' });
              });
          } else {
            fulfilled.push({ value: invoked, status: 'fulfilled' });
          }
        } catch(e) {
          rejected.push({ value: e, status: 'rejected' });
        }
      } else {
        fulfilled.push({ value: operation, status: 'fulfilled' });
      }
      return null;
    },
    decompress(data?: QueueNode): any {
      return null;
    },
    concurrency: conc,
  });

  const p = queue
    .insert(...fns)
    .resolve() as Promise<any>;
  
  return p
    .then(() => callback(null, { fulfilled, rejected } as SettleValues))
    .catch(callback);
}