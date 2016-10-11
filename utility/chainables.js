'use strict';

module.exports = {
  try: function (resources) {
    return function (onSuccess, onFailure) {
      let success = function (data) {
        try {
          return (typeof onSuccess === 'function') ? onSuccess(data) : null;
        }
        catch (e) {
          return Promise.reject(e);
        }
      };
      let failure = (typeof onFailure === 'function') ? onFailure : undefined;
      return this.then(success, failure);
    };
  },
  spread: function (resources) {
    return function (onSuccess, onFailure) {
      let success = function (data) {
        if (typeof data[Symbol.iterator] !== 'function') return Promise.reject(new TypeError('ERROR: spread expects input to be iterable'));
        if (typeof onSuccess !== 'function') return Promise.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
        return onSuccess(...data);
      };
      let failure = (typeof onFailure === 'function') ? onFailure : undefined;
      return this.then(success, failure);
    };
  },
  map: function (resources) {
    return function (onSuccess, onFailure, concurrency) {
      if (typeof onFailure === 'number') {
        concurrency = onFailure;
        onFailure = undefined;
      }
      let success = function (data) {
        if (!Array.isArray(data)) return Promise.reject(new TypeError('ERROR: map expects input to be an array'));
        if (typeof onSuccess !== 'function') return Promise.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
        return resources.Promisie.map(data, concurrency, onSuccess);
      };
      let failure = (typeof onFailure === 'function') ? onFailure : undefined;
      return this.then(success, failure);
    };
  }
};