function timeout(time = 0) {
    return new Promise(resolve => {
        let _timeout = setTimeout(function () {
            clearTimeout(_timeout);
            resolve();
        }, time);
    });
}
;
export default function makeRetryGenerator(fn, options) {
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
                    current = { __isRejected: false, e: null, value: result };
                    return current;
                }, (e) => {
                    current = { __isRejected: true, e, value: null };
                    return current;
                });
            }
            else {
                current = { __isRejected: false, e: null, value: invoked };
                yield current;
            }
        } while (times
            && (current
                && Object.hasOwnProperty.call(current, '__isRejected')));
        return current;
    };
}
;
