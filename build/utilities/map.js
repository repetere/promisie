import Queue from './queue';
export default function map(operation, values, concurrency, cb) {
    const callback = (typeof concurrency === 'function') ? concurrency : cb;
    const conc = (typeof concurrency === 'number') ? concurrency : undefined;
    const queue = new Queue({
        action: operation,
        concurrency: conc,
    });
    const p = queue.insert(...values).resolve();
    return p
        .then(result => callback(null, result))
        .catch(callback);
}
;
