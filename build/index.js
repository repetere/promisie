import utilities from './utilities';
function isNestedPromisifyAllObjectParam(v) {
    return v && typeof v === 'object';
}
function setHandlers(success, failure) {
    return {
        success,
        failure: (typeof failure === 'function') ? failure : undefined
    };
}
;
export default class Promisie extends Promise {
    constructor(callback) {
        super(callback);
    }
    then(onfulfilled, onrejected) {
        return super.then(onfulfilled, onrejected);
    }
    try(onfulfilled, onrejected) {
        const { success, failure } = setHandlers(function (data) {
            try {
                return (typeof onfulfilled === 'function')
                    ? onfulfilled(data)
                    : Promisie.reject(new TypeError('ERROR: try expects onSuccess handler to be a function'));
            }
            catch (e) {
                return Promisie.reject(e);
            }
        }, onrejected);
        return this.then(success, failure);
    }
    spread(onfulfilled, onrejected) {
        const { success, failure } = setHandlers(function (data) {
            if (typeof data[Symbol.iterator] !== 'function') {
                return Promisie.reject(new TypeError('ERROR: spread expects input to be iterable'));
            }
            if (typeof onfulfilled !== 'function') {
                return Promisie.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
            }
            return onfulfilled(...data);
        }, onrejected);
        return this.then(success, failure);
    }
    map(onfulfilled, onrejected, concurrency) {
        if (typeof onrejected === 'number') {
            concurrency = onrejected;
            onrejected = undefined;
        }
        const { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: map expects input to be an array'));
            }
            if (typeof onfulfilled !== 'function') {
                return Promisie.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
            }
            return Promisie.map(data, concurrency, onfulfilled);
        }, onrejected);
        return this.then(success, failure);
    }
    each(onfulfilled, onrejected, concurrency) {
        if (typeof onrejected === 'number') {
            concurrency = onrejected;
            onrejected = undefined;
        }
        const { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: each expects input to be an array'));
            }
            if (typeof onfulfilled !== 'function') {
                return Promisie.reject(new TypeError('ERROR: each expects onSuccess handler to be a function'));
            }
            return Promisie.each(data, concurrency, onfulfilled);
        }, onrejected);
        return this.then(success, failure);
    }
    settle(onfulfilled, onrejected) {
        const { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: settle expects input to be an array'));
            }
            if (typeof onfulfilled !== 'function') {
                return Promisie.reject(new TypeError('ERROR: settle expects onSuccess handler to be a function'));
            }
            const operations = data.map(d => () => onfulfilled(d));
            return Promisie.settle(operations);
        }, onrejected);
        return this.then(success, failure);
    }
    retry(onfulfilled, onrejected, options) {
        if (onrejected && typeof onrejected === 'object') {
            options = onrejected;
            onrejected = undefined;
        }
        const { success, failure } = setHandlers(function (data) {
            if (typeof onfulfilled !== 'function')
                return Promisie.reject(new TypeError('ERROR: retry expects onSuccess handler to be a function'));
            return Promisie.retry(() => {
                return onfulfilled(data);
            }, options);
        }, onrejected);
        return this.then(success, failure);
    }
    finally(onfulfilled) {
        const _handler = () => (typeof onfulfilled === 'function')
            ? onfulfilled()
            : Promisie.reject(new TypeError('ERROR: finally expects handler to be a function'));
        return this.then(_handler, _handler);
    }
    static promisify(fn, _this) {
        const promisified = function (...args) {
            return new Promisie((resolve, reject) => {
                args.push(function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
                fn.apply(this, args);
            });
        };
        if (_this) {
            return promisified.bind(_this);
        }
        return promisified;
    }
    static promisifyAll(mod, _this, options) {
        const withDefaultOptions = Object.assign({
            readonly: true,
            recursive: false,
        }, options);
        let input = Object.create(mod);
        if (!withDefaultOptions.readonly) {
            input = Object.assign(input, mod);
        }
        else {
            input = utilities.safeAssign(mod);
        }
        const promisified = {};
        Object.keys(input).forEach((key) => {
            if (typeof input[key] === 'function') {
                promisified[`${key}Async`] = (_this)
                    ? this.promisify(input[key], _this)
                    : this.promisify(input[key]);
            }
            else if (withDefaultOptions.recursive) {
                const v = input[key];
                if (isNestedPromisifyAllObjectParam(v)) {
                    promisified[key] = this.promisifyAll(v, _this, withDefaultOptions);
                }
            }
        });
        return promisified;
    }
    static series(fns) {
        return Promisie.iterate(utilities.series(fns), null);
    }
    static pipe(fns) {
        return function (...args) {
            const operations = Object.assign([], fns);
            const first = operations[0];
            operations[0] = function () {
                return first(...args);
            };
            return Promisie.series(operations);
        };
    }
    static compose(fns) {
        return Promisie.pipe(fns.reverse());
    }
    static map(datas, concurrency, fn) {
        const method = (typeof concurrency === 'function')
            ? concurrency
            : fn;
        if (typeof concurrency !== 'number') {
            concurrency = 1;
        }
        return Promisie.promisify(utilities.map)(method, datas, concurrency);
    }
    static each(datas, concurrency, fn) {
        return Promisie
            .map(datas, concurrency, fn)
            .then(() => datas);
    }
    static parallel(fns, args, options = {}) {
        const { recursive = false, concurrency } = options;
        if (recursive) {
            fns = utilities.handleRecursiveParallel(fns);
        }
        return Promisie.promisify(utilities.parallel)(fns, args, concurrency);
    }
    static settle(fns, concurrency) {
        return Promisie.promisify(utilities.settle)(fns, concurrency);
    }
    static iterate(generator, initial) {
        const iterator = utilities.iterator(generator(initial));
        return Promisie.promisify(iterator)(initial);
    }
    static doWhilst(fn, evaluate) {
        return Promisie.iterate(utilities.doWhilst(fn, evaluate), null);
    }
    static sleep(timeout) {
        return new Promisie((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    }
    static retry(fn, options) {
        const { times = 3, timeout = 0 } = options || {};
        return Promisie.iterate(utilities.retry(fn, { times, timeout }), null)
            .then(result => {
            const { __isRejected, e, value } = result;
            if (__isRejected) {
                return Promisie.reject(e);
            }
            return Promisie.resolve(value);
        });
    }
}
