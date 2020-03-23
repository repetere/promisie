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
export class QueueNode {
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
;
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
;
export default class Queue {
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
