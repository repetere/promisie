(function () {
  'use strict';

  const path = require('path');
  const series_generator = require('./series_generator');
  const series_iterator = require('./iterator');
  const divide = require('./divisions');
  const chainables = require('./chainables');
  const parallel_generator = require('./parallel_generator');
  const settle_generator = require('./settle_generator');
  const dowhilst_generator = require('./dowhilst_generator');
  const retry_generator = require('./retry_generator');
  const { QUEUE } = require(path.join(__dirname, '../bin/index'));
  //@ts-ignore
  var _series = function (operations, cb) {
      for (let i = 0; i < operations.length; i++) {
          if (typeof operations[i] !== 'function')
              return cb(new TypeError(`ERROR: series can only be called with functions - argument ${i}: ${operations[i]}`));
      }
      let operator = series_generator(operations);
      let iterate = series_iterator(operator, cb);
      iterate();
  };
  //@ts-ignore
  var _map = function (operation, values, concurrency, cb) {
      if (!Array.isArray(values))
          cb(new TypeError('ERROR: map can only be called with an Array'));
      cb = (typeof concurrency === 'function') ? concurrency : cb;
      let queue = new QUEUE(operation, concurrency, values);
      return queue.insert(...queue.values)
          .resolve()
          //@ts-ignore
          .then(result => cb(null, result))
          .catch(cb);
  };
  //@ts-ignore
  var _settle = function (fns) {
      try {
          //@ts-ignore
          let fulfilled = [];
          //@ts-ignore
          let rejected = [];
          //@ts-ignore
          fns[Symbol.iterator] = settle_generator(fns, fulfilled, rejected);
          //@ts-ignore
          return this.all(fns)
              .then(() => {
              return {
                  //@ts-ignore
                  fulfilled: (fulfilled.length < 1) ? fulfilled : fulfilled.sort((a, b) => a.index - b.index),
                  //@ts-ignore
                  rejected: (rejected.length < 1) ? rejected : rejected.sort((a, b) => a.index - b.index)
              };
              //@ts-ignore
          }, e => this.reject(e));
      }
      catch (e) {
          //@ts-ignore
          return this.reject(e);
      }
  };
  //@ts-ignore
  var _parallel = function (fns, args) {
      try {
          let result = Array.isArray(fns) ? [] : {};
          fns[Symbol.iterator] = parallel_generator(fns, args, result);
          //@ts-ignore
          return this.all(fns)
              //@ts-ignore
              .then(() => result, e => this.reject(e));
      }
      catch (e) {
          //@ts-ignore
          return this.reject(e);
      }
  };
  //@ts-ignore
  var _dowhilst = function (fn, evaluate, cb) {
      try {
          let operator = dowhilst_generator(fn, evaluate)();
          let iterate = series_iterator(operator, cb);
          iterate();
      }
      catch (e) {
          cb(e);
      }
  };
  //@ts-ignore
  var _iterate = function (generator, cb) {
      let iterate = series_iterator(generator, cb);
      iterate();
  };
  //@ts-ignore
  var _retry = function (fn, options, cb) {
      try {
          //@ts-ignore
          let operator = retry_generator.call(this, fn, options)();
          let iterate = series_iterator(operator, cb);
          iterate();
      }
      catch (e) {
          cb(e);
      }
  };
  //@ts-ignore
  var safe_assign = function (data) {
      let result = {};
      for (let key in data) {
          let descriptor = Object.getOwnPropertyDescriptor(data, key);
          //@ts-ignore
          if (descriptor && descriptor.writable)
              result[key] = data[key];
      }
      return result;
  };
  //@ts-ignore
  var isGenerator = function (val) {
      let generator = function* () { yield true; };
      return val.constructor === generator.constructor;
  };
  //@ts-ignore
  var _handleRecursiveParallel = function (fns) {
      return Object.keys(fns).reduce((result, key) => {
          //@ts-ignore
          if (fns[key] && typeof fns[key] === 'object')
              result[key] = this.parallel.bind(this, _handleRecursiveParallel.call(this, fns[key]));
          //@ts-ignore
          else
              result[key] = fns[key];
          return result;
      }, (Array.isArray(fns)) ? [] : {});
  };
  module.exports = {
      series_generator,
      series_iterator,
      divide,
      chainables,
      parallel_generator,
      settle_generator,
      _series,
      _map,
      _parallel,
      _settle,
      safe_assign,
      isGenerator,
      _dowhilst,
      _iterate,
      _retry,
      _handleRecursiveParallel
  };

}());
