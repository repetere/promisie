'use strict';

module.exports = function (fns, fulfilled = [], rejected = []) {
  let index = 0;
  return function* () {
    while (index < fns.length) {
      let currentIndex = index++;
      if (typeof fns[currentIndex] !== 'function') {
        fulfilled.push({ value: fns[currentIndex], index: currentIndex, status: 'fulfilled' });
        yield fns[currentIndex];
      }
      else {
        let invoked = fns[currentIndex]();
        if (invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function') {
          yield invoked
            .then(value => {
              fulfilled.push({ value, index: currentIndex, status: 'fulfilled' });
              return value;
            }, e => {
              rejected.push({ value: e, index: currentIndex, status: 'rejected' });
              return null;
            });
        }
        else {
          fulfilled.push({ value: invoked, index: currentIndex, status: 'fulfilled' });
          yield invoked;
        }
      }
    }
  };
};