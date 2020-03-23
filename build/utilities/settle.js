import Queue from './queue';
export default function settle(fns, concurrency, cb) {
    const callback = (typeof concurrency === 'function') ? concurrency : cb;
    const conc = (typeof concurrency === 'number') ? concurrency : undefined;
    const fulfilled = [];
    const rejected = [];
    const queue = new Queue({
        action(operation) {
            if (typeof operation === 'function') {
                try {
                    const invoked = operation();
                    if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
                        return invoked
                            .then((result) => {
                            fulfilled.push({ value: result, status: 'fulfilled' });
                        }, (err) => {
                            rejected.push({ value: err, status: 'rejected' });
                        });
                    }
                    else {
                        fulfilled.push({ value: invoked, status: 'fulfilled' });
                    }
                }
                catch (e) {
                    rejected.push({ value: e, status: 'rejected' });
                }
            }
            else {
                fulfilled.push({ value: operation, status: 'fulfilled' });
            }
            return null;
        },
        decompress(data) {
            return null;
        },
        concurrency: conc,
    });
    const p = queue
        .insert(...fns)
        .resolve();
    return p
        .then(() => callback(null, { fulfilled, rejected }))
        .catch(callback);
}
