import Queue from './queue';
import Promisie from '../';
export default function parallel(fns, args, concurrency, cb) {
    const callback = (typeof concurrency === 'function') ? concurrency : cb;
    const conc = (typeof concurrency === 'number') ? concurrency : undefined;
    const queue = new Queue({
        action: (p) => {
            const { operation, key } = p;
            if (typeof operation === 'function') {
                if (Array.isArray(args)) {
                    const params = args;
                    return Promise.all([operation(...params), key]);
                }
                return Promise.all([operation(args), key]);
            }
            return [operation, key];
        },
        concurrency: conc,
        decompress: (data) => {
            const result = {};
            let current = data;
            while (current) {
                const [value, key] = current.value;
                result[key] = value;
                current = current.next;
            }
            return result;
        },
    });
    const p = queue
        .insert(...Object.keys(fns).map(key => ({ operation: fns[key], key })))
        .resolve();
    return p
        .then(result => callback(null, result))
        .catch(callback);
}
export function handleRecursiveParallel(fns) {
    return Object.keys(fns).reduce((result, key) => {
        if (fns[key] && typeof fns[key] === 'object') {
            result[key] = () => (Promisie.parallel(handleRecursiveParallel(fns[key])));
        }
        else {
            result[key] = fns[key];
        }
        return result;
    }, {});
}
