function safeAssign(data) {
    let result = {};
    for (let key in data) {
        let descriptor = Object.getOwnPropertyDescriptor(data, key);
        //@ts-ignore
        if (descriptor && descriptor.writable)
            result[key] = data[key];
    }
    return result;
}

const IS_PENDING = Symbol('isPending');
const IS_FULFILLED = Symbol('isFulfulled');
const IS_REJECTED = Symbol('isRejected');
const IS_PAUSED = Symbol('isPaused');
function fulfill(value, resolve) {
    if (typeof this.timeout === 'number' && this.timeout > 0) {
        const timeout = setTimeout(() => {
            this.value = value;
            resolve(value);
            clearTimeout(timeout);
        }, this.timeout);
    }
    else {
        this.value = value;
        resolve(value);
    }
}
function reject(e, reject) {
    if (typeof this.timeout === 'number') {
        const timeout = setTimeout(() => {
            reject(e);
            clearTimeout(timeout);
        }, this.timeout);
    }
    else {
        reject(e);
    }
}
class QueueNode {
    constructor(options) {
        this.action = options.action;
        this.timeout = options.timeout || 0;
        this.index = options.index;
        this.value = options.value;
        this[IS_PENDING] = true;
        this[IS_FULFILLED] = false;
        this[IS_REJECTED] = false;
        this.fulfill = fulfill.bind(this);
        this.reject = reject.bind(this);
        this.next = undefined;
    }
    resolve(value) {
        return new Promise((resolve, reject) => {
            try {
                const invoked = (typeof this.action === 'function')
                    ? this.action(value)
                    : this.action;
                if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
                    return invoked
                        .then((result) => this.fulfill(result, resolve))
                        .catch((e) => this.reject(e, reject));
                }
                else {
                    this.fulfill(invoked, resolve);
                }
            }
            catch (e) {
                this.reject(e, reject);
            }
        });
    }
}
function decompress(data) {
    let result = [];
    let current = data;
    while (current) {
        result.push(current.value);
        current = current.next;
    }
    return result;
}
function handleResolve(resolve, reject) {
    while (this.active < this.concurrency && this.current) {
        this.active++;
        let current = this.current;
        this.current = current.next;
        current.action = this.action;
        current.resolve(current.value)
            .then(result => {
            if (--this.active === 0 && !this.current)
                resolve(decompress(this.root));
            else
                this.resolve(resolve, reject);
        }, e => {
            this[IS_REJECTED] = true;
            reject(e);
        });
    }
}
class Queue {
    constructor(options) {
        this.action = options.action;
        this.concurrency = options.concurrency || Infinity;
        this.values = options.values || [];
        this.active = 0;
        this.timeout = options.timeout || 0;
        this.current = undefined;
        this[IS_PAUSED] = false;
        this[IS_REJECTED] = false;
        this.root = undefined;
        this.length = 0;
        this.decompress = (options.decompress || decompress).bind(this);
    }
    insert(...args) {
        for (let i = 0; i < args.length; i++) {
            this.length++;
            if (!this.root) {
                this.root = new QueueNode({
                    index: i,
                    action: undefined,
                    value: args[i],
                    timeout: this.timeout,
                });
            }
            else {
                let current = this.root;
                while (current && current.next) {
                    current = current.next;
                }
                current.next = new QueueNode({
                    index: i,
                    action: undefined,
                    value: args[i],
                    timeout: this.timeout,
                });
            }
        }
        this.current = this.root;
        return this;
    }
    resolve(resolve, reject) {
        if (!this.current || this[IS_REJECTED] || this[IS_PAUSED]) {
            return null;
        }
        if (resolve && reject) {
            handleResolve.call(this, resolve, reject);
        }
        else {
            return new Promise((rs, rj) => {
                handleResolve.call(this, rs, rj);
            });
        }
    }
}

function map(operation, values, concurrency, cb) {
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

function parallel(fns, args, concurrency, cb) {
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
                return [operation(args), key];
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
        .insert(...Object.keys(fns).map(key => [fns[key], key]))
        .resolve();
    return p
        .then(result => callback(null, result))
        .catch(callback);
}
function handleRecursiveParallel(fns) {
    return Object.keys(fns).reduce((result, key) => {
        if (fns[key] && typeof fns[key] === 'object') {
            result[key] = () => (Promisie.parallel(handleRecursiveParallel(fns[key])));
        }
        else {
            result[key] = key;
        }
        return result;
    }, {});
}

function settle(fns, concurrency, cb) {
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
                        invoked
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

function iterator(generator, cb) {
    return function iterate(state) {
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
                value.then(iterate, cb);
            }
            else {
                let timeout = setTimeout(() => {
                    iterate(value);
                    clearTimeout(timeout);
                }, 0);
            }
        }
        else {
            cb(null, value);
        }
    };
}

function makeDoWhilstGenerator(fn, evaluate) {
    let current;
    return function* doWhilst() {
        do {
            const invoked = fn();
            if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
                yield invoked
                    .then((result) => {
                    current = result;
                    return current;
                }, (e) => Promise.reject(e));
            }
            else {
                current = invoked;
                yield current;
            }
        } while (evaluate(current));
    };
}

function timeout(time = 0) {
    return new Promise(resolve => {
        let _timeout = setTimeout(function () {
            clearTimeout(_timeout);
            resolve();
        }, time);
    });
}
function makeRetryGenerator(fn, options) {
    let current;
    let isFirst = true;
    let { times, timeout: to } = options;
    return function* retry() {
        do {
            times--;
            let invoked = (isFirst || typeof to !== 'number' || to === 0) ? fn() : (() => {
                return timeout(to)
                    .then(fn)
                    .catch(e => Promise.reject(e));
            })();
            isFirst = false;
            if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
                yield invoked
                    .then((result) => {
                    current = result;
                    return current;
                }, (e) => {
                    current = { __isRejected: true, e };
                    return current;
                });
            }
            else {
                current = invoked;
                yield current;
            }
        } while (times
            && (current
                && Object.hasOwnProperty.call(current, '__isRejected')));
        return current;
    };
}

var utilities = {
    safeAssign,
    map,
    parallel,
    handleRecursiveParallel,
    settle,
    iterator,
    doWhilst: makeDoWhilstGenerator,
    retry: makeRetryGenerator,
};

function isNestedPromisifyAllObjectParam(v) {
    return v && typeof v === 'object';
}
function setHandlers(success, failure) {
    return {
        success,
        failure: (typeof failure === 'function') ? failure : undefined
    };
}
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
class Promisie extends Promise {
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

export default Promisie;
//# sourceMappingURL=index.esm.js.map
