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
const thenables = {
    try(onSuccess, onFailure) {
        const { success, failure } = setHandlers(function (data) {
            try {
                return (typeof onSuccess === 'function')
                    ? onSuccess(data)
                    : Promisie.reject(new TypeError('ERROR: try expects onSuccess handler to be a function'));
            }
            catch (e) {
                return Promisie.reject(e);
            }
        }, onFailure);
        return this.then(success, failure);
    },
    spread(onSuccess, onFailure) {
        const { success, failure } = setHandlers(function (data) {
            if (typeof data[Symbol.iterator] !== 'function') {
                return Promisie.reject(new TypeError('ERROR: spread expects input to be iterable'));
            }
            if (typeof onSuccess !== 'function') {
                return Promisie.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
            }
            return onSuccess(...data);
        }, onFailure);
        return this.then(success, failure);
    },
    map(onSuccess, onFailure, concurrency) {
        if (typeof onFailure === 'number') {
            concurrency = onFailure;
            onFailure = undefined;
        }
        const { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: map expects input to be an array'));
            }
            if (typeof onSuccess !== 'function') {
                return Promisie.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
            }
            return Promisie.map(data, concurrency, onSuccess);
        }, onFailure);
        return this.then(success, failure);
    },
    each(onSuccess, onFailure, concurrency) {
        if (typeof onFailure === 'number') {
            concurrency = onFailure;
            onFailure = undefined;
        }
        const { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: each expects input to be an array'));
            }
            if (typeof onSuccess !== 'function') {
                return Promisie.reject(new TypeError('ERROR: each expects onSuccess handler to be a function'));
            }
            return Promisie.each(data, concurrency, onSuccess);
        }, onFailure);
        return this.then(success, failure);
    },
    settle(onSuccess, onFailure) {
        let { success, failure } = setHandlers(function (data) {
            if (!Array.isArray(data)) {
                return Promisie.reject(new TypeError('ERROR: settle expects input to be an array'));
            }
            if (typeof onSuccess !== 'function') {
                return Promisie.reject(new TypeError('ERROR: settle expects onSuccess handler to be a function'));
            }
            let operations = data.map(d => () => onSuccess(d));
            return Promisie.settle(operations);
        }, onFailure);
        return this.then(success, failure);
    },
    retry(onSuccess, onFailure, options) {
        if (typeof onFailure === 'object') {
            options = onFailure;
            onFailure = undefined;
        }
        let { success, failure } = setHandlers(function (data) {
            if (typeof onSuccess !== 'function')
                return Promisie.reject(new TypeError('ERROR: retry expects onSuccess handler to be a function'));
            return Promisie.retry(() => {
                return onSuccess(data);
            }, options);
        }, onFailure);
        return this.then(success, failure);
    },
    finally(onSuccess) {
        let _handler = () => (typeof onSuccess === 'function')
            ? onSuccess()
            : Promisie.reject(new TypeError('ERROR: finally expects handler to be a function'));
        return this.then(_handler, _handler);
    },
};
export default class Promisie extends Promise {
    constructor(callback) {
        super(callback);
        for (let key in thenables) {
            this[key] = thenables[key].bind(this);
        }
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
    static async series(fns) {
        let last;
        for (let i = 0; i < fns.length; i++) {
            last = await fns[i](last);
        }
        return last;
    }
    static pipe(fns) {
        return async function (...args) {
            const operations = Object.assign([], fns);
            const first = operations[0];
            operations[0] = function () {
                return first(...args);
            };
            return await Promisie.series(fns);
        };
    }
    static compose(fns) {
        return Promisie.pipe(fns.reverse());
    }
    static map(datas, concurrency, fn) {
        const method = (typeof concurrency === 'function')
            ? concurrency
            : fn;
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
        return Promisie.promisify(utilities.iterator)(generator(initial));
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
        return Promisie.iterate(utilities.retry(fn, { times, timeout }), null);
    }
}
// const p = Promisie;
// export default p;
