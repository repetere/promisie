(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UTILITY = require('./utility/index');
var CHAINABLES = UTILITY.chainables;
/**
 * Promisie inherits from the Promise class and adds helpful chainble methods
 * @class Promisie
 * @extends {Promise}
 */

var Promisie = function (_Promise) {
  _inherits(Promisie, _Promise);

  /**
   * @constructor {Function} Constructor for Promisie class
   * @param {Object} options Passes options to Promise constructor
   * @return {Object} Returns instance of Promisie
   */
  function Promisie(options) {
    _classCallCheck(this, Promisie);

    var _this2 = _possibleConstructorReturn(this, (Promisie.__proto__ || Object.getPrototypeOf(Promisie)).call(this, options));

    for (var key in CHAINABLES) {
      _this2[key] = CHAINABLES[key]({ Promisie: Promisie });
    }
    return _this2;
  }
  /**
   * @static promisify static method
   * @param {Function} fn Async function that expects a callback
   * @param {*} [_this] Optional "this" that will be bound to the promisified function 
   * @return {Function} Returns a promisifed function which returns a Promise
   */


  _createClass(Promisie, null, [{
    key: 'promisify',
    value: function promisify(fn, _this) {
      if (typeof fn !== 'function') throw new TypeError('ERROR: promisify must be called with a function');else {
        var promisified = function promisified() {
          var _this3 = this;

          var args = [].concat(Array.prototype.slice.call(arguments));
          return new Promisie(function (resolve, reject) {
            args.push(function (err, data) {
              if (err) reject(err);else resolve(data);
            });
            fn.apply(_this3, args);
          });
        };
        if (_this) return promisified.bind(_this);else return promisified;
      }
    }
    /**
     * @static promisifyAll static method
     * @param {Object} mod An object or array containing functions to be promisified non-functions can be included an will be skipped
     * @param {*} [_this] Optional "this" that will be bound to all promisified functions
     * @param {Object} [options={recursive:false,readonly:true}] Options for the execution of promisifyAll
     * @param {boolean} options.recursive If true promisifyAll will recursively promisify functions inside of child objects
     * @param {boolean} options.readonly If true promisifyAll will ensure that property is writable before trying to re-assign
     * @return {Object} Returns a clone of original object or array with promisified functions
     */

  }, {
    key: 'promisifyAll',
    value: function promisifyAll(mod, _this) {
      var _this4 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { recursive: false, readonly: true };

      if (mod && (typeof mod === 'undefined' ? 'undefined' : _typeof(mod)) === 'object') {
        var _ret = function () {
          var promisified = Object.create(mod);
          if (!options.readonly) promisified = Object.assign(promisified && (typeof promisified === 'undefined' ? 'undefined' : _typeof(promisified)) === 'object' ? promisified : {}, mod);else promisified = UTILITY.safe_assign(mod);
          Object.keys(promisified).forEach(function (key) {
            if (typeof promisified[key] === 'function') promisified[key + 'Async'] = _this ? _this4.promisify(promisified[key]).bind(_this) : _this4.promisify(promisified[key]);
            if (typeof options === 'boolean' && options || options && options.recursive) {
              if (promisified[key] && _typeof(promisified[key]) === 'object') promisified[key] = _this4.promisifyAll(promisified[key], _this, options);
            }
          });
          return {
            v: promisified
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else throw new TypeError('ERROR: promisifyAll must be called with an object or array');
    }
    /**
     * @static series static method
     * @param {Array|Object} fns An array or iterable object containing functions that will be run in series
     * @return {Object} Returns an instance of Promisie which resolves after the series finishes execution
     */

  }, {
    key: 'series',
    value: function series(fns) {
      var operations = Array.isArray(fns) ? fns : [].concat(Array.prototype.slice.call(arguments));
      var handlesSyncErrors = process && process.version && process.version.node ? Number(process.version.node.split('.')[0]) > 6 : false;
      return Promisie.promisify(UTILITY._series)(handlesSyncErrors ? operations : operations.map(function (operation) {
        return function () {
          try {
            return operation.apply(undefined, arguments);
          } catch (e) {
            return Promisie.reject(e);
          }
        };
      }));
    }
    /**
     * @static pipe static method
     * @param {Array|Object} fns An array or iterable object containing functions that will be run in series
     * @return {Object} Returns an function which will run Promisie.series when called
     */

  }, {
    key: 'pipe',
    value: function pipe(fns) {
      var operations = Array.isArray(fns) ? fns : [].concat(Array.prototype.slice.call(arguments));
      for (var i = 0; i < operations.length; i++) {
        if (typeof operations[i] !== 'function') throw new TypeError('ERROR: pipe can only be called with functions - argument ' + i + ': ' + operations[i]);
      }
      /**
       * Pipe function that is returned by static method will run series when called and pass all arguments to first function in series
       * @param {...*} Accepts any arguments
       * @return {Object} Returns an instance of Promisie which resolves once series finished execution
       */
      return function pipe() {
        var argv = arguments;
        var _operations = Object.assign([], operations);
        var first = _operations[0];
        _operations[0] = function () {
          return first.apply(undefined, _toConsumableArray(argv));
        };
        return Promisie.promisify(UTILITY._series)(_operations);
      };
    }
    /**
     * @static map static method
     * @param {*} datas An array of data to be used as first argument in iterator function
     * @param {number} [concurrency] Optional concurrency limit
     * @param {Function} fn Iterator function for map if concurrency isn't passed it fn can be passed as second argument
     * @return {Object} Returns and instance of Promisie which resolves with an array of resolved values
     */

  }, {
    key: 'map',
    value: function map(datas, concurrency, fn) {
      if (typeof concurrency === 'function') {
        fn = concurrency;
        concurrency = undefined;
      }
      var operations = datas.map(function (data) {
        return function () {
          return fn(data);
        };
      });
      return Promisie.promisify(UTILITY._map)(operations, concurrency);
    }
    /**
     * @static each static method
     * @param {*} datas An array of data to be used as first argument in iterator function
     * @param {number} [concurrency] Optional concurrency limit
     * @param {Function} fn Iterator function for each if concurrency isn't passed it fn can be passed as second argument
     * @return {Object} Returns and instance of Promisie which resolves with original datas argument
     */

  }, {
    key: 'each',
    value: function each(datas, concurrency, fn) {
      return Promisie.map(datas, concurrency, fn).then(function () {
        return datas;
      }, function (e) {
        return Promisie.reject(e);
      });
    }
    /**
     * @static parallel static method
     * @param {Object|Function[]} fns Array of functions or object containing functions. If an object will resolve to an object with matching keys mapped to resolve values
     * @param {*} args An array of arguments or a single argument that will be passed to each function being run in parallel
     * @return {Object} Returns and instance of Promisie which resolves after parallel operations are complete
     */

  }, {
    key: 'parallel',
    value: function parallel(fns, args) {
      if (Array.isArray(fns)) return Promisie.all(fns);else return UTILITY._parallel.call(Promisie, fns, args);
    }
    /**
     * @static settle static method
     * @param {Function[]|Object} fns An array of functions or object containing functions
     * @return {Object} Returns a Promisie which resolves with an object containing a "fulfilled" and "rejected" property. Almost always resolves rejected promises will be in "rejected" array and resolved will be in "fulfilled" array
     */

  }, {
    key: 'settle',
    value: function settle(fns) {
      return UTILITY._settle.call(Promisie, fns);
    }
    /**
     * @static compose static method
     * @param {Function[] fns An array of functions that will be compiled into pipe
     * @return {Function} Almost the exact same functionality as Promisie.pipe except fns are reversed before being compiled into pipe
     */

  }, {
    key: 'compose',
    value: function compose(fns) {
      var operations = Array.isArray(fns) ? fns : [].concat(Array.prototype.slice.call(arguments));
      for (var i = 0; i < operations.length; i++) {
        if (typeof operations[i] !== 'function') throw new TypeError('ERROR: compose can only be called with functions - argument ' + i + ': ' + operations[i]);
      }
      operations = operations.reverse();
      return Promisie.pipe(operations);
    }
    /**
     * @static all static method
     * @param {Object[]|...Object|Object} argument An array of unresolved Promises, or an argument list comprised of unresolved Promises, or an iterable object containing unresolved Promises
     * @return {Object} Returns and instance of Promise which resolves once all Promises have resolved
     */

  }, {
    key: 'all',
    value: function all() {
      var argv = [].concat(Array.prototype.slice.call(arguments));
      if (argv.length === 1 && Array.isArray(argv[0])) return _get(Promisie.__proto__ || Object.getPrototypeOf(Promisie), 'all', this).call(this, argv[0]);else if (argv.length === 1 && typeof argv[0][Symbol.iterator] === 'function') return _get(Promisie.__proto__ || Object.getPrototypeOf(Promisie), 'all', this).call(this, [].concat(_toConsumableArray(argv[0])));else return _get(Promisie.__proto__ || Object.getPrototypeOf(Promisie), 'all', this).call(this, [].concat(Array.prototype.slice.call(arguments)));
    }
    /**
     * @static iterate static method
     * @param {Function} generator An uninitialized generator function
     * @param {*} initial An initial value to be passed to the generator
     * @return {Object} Returns a Promisie which resolves once generator has yielded its last value
     */

  }, {
    key: 'iterate',
    value: function iterate(generator, initial) {
      var isGenerator = UTILITY.isGenerator(generator);
      if (!isGenerator) throw new TypeError('ERROR: iterate can only be called with generators - argument: ' + generator.constructor);
      var initialized = generator(initial);
      return Promisie.promisify(UTILITY._iterate)(initialized);
    }
    /**
     * @static doWhilst static method
     * @param {Function} fn Iterator function that will be called until evalution returns false
     * @param {Function} evaluate An evaluation function that is run after each iteration of fn resolves. If evaluate returns true iterator will be called again
     * @return {Object} Returns a Promisie which resolves once evaluate function return false
     */

  }, {
    key: 'doWhilst',
    value: function doWhilst(fn, evaluate) {
      if (typeof fn !== 'function' || typeof evaluate !== 'function') throw new TypeError('ERROR: doWhilst expects that fn and evaluate params are functions');
      return Promisie.promisify(UTILITY._dowhilst)(fn, evaluate);
    }
    /**
     * @static retry static method
     * @param {Function} fn Function that will be called by retry until retry limit is reached or resolves
     * @param {Object} [options={times:3,timeout:0}] Configurable options for retry
     * @param {number} options.times Times to retry function before rejecting on error defaults to 3
     * @param {number} options.timeout Timeout between each retry in ms defaults to 0
     * @return {Object} Returns a Promisie which resolves once function successfully resolves or rejects at retry limit
     */

  }, {
    key: 'retry',
    value: function retry(fn) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { times: 3, timeout: 0 };

      if (typeof fn !== 'function') throw new TypeError('ERROR: retry expects that fn is a function');
      return Promisie.promisify(UTILITY._retry, Promisie)(fn, options).then(function (val) {
        if (val.__isRejected) return Promisie.reject(val.e);
        return val;
      }, function (e) {
        return Promisie.reject(e);
      });
    }
  }]);

  return Promisie;
}(Promise);

module.exports = Promisie;

}).call(this,require('_process'))
},{"./utility/index":6,"_process":2}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var setHandlers = function setHandlers(success, failure) {
  return {
    success: success,
    failure: typeof failure === 'function' ? failure : undefined
  };
};

var CHAINABLES = {
  try: function _try(resources) {
    return function _try(onSuccess, onFailure) {
      var _setHandlers = setHandlers(function (data) {
        try {
          return typeof onSuccess === 'function' ? onSuccess(data) : resources.Promisie.reject(new TypeError('ERROR: try expects onSuccess handler to be a function'));
        } catch (e) {
          return resources.Promisie.reject(e);
        }
      }, onFailure),
          success = _setHandlers.success,
          failure = _setHandlers.failure;

      return this.then(success, failure);
    };
  },
  spread: function spread(resources) {
    return function _spread(onSuccess, onFailure) {
      var _setHandlers2 = setHandlers(function (data) {
        if (typeof data[Symbol.iterator] !== 'function') return resources.Promisie.reject(new TypeError('ERROR: spread expects input to be iterable'));
        if (typeof onSuccess !== 'function') return resources.Promisie.reject(new TypeError('ERROR: spread expects onSuccess handler to be a function'));
        return onSuccess.apply(undefined, _toConsumableArray(data));
      }, onFailure),
          success = _setHandlers2.success,
          failure = _setHandlers2.failure;

      return this.then(success, failure);
    };
  },
  map: function map(resources) {
    return function _map(onSuccess, onFailure, concurrency) {
      if (typeof onFailure === 'number') {
        concurrency = onFailure;
        onFailure = undefined;
      }

      var _setHandlers3 = setHandlers(function (data) {
        if (!Array.isArray(data)) return resources.Promisie.reject(new TypeError('ERROR: map expects input to be an array'));
        if (typeof onSuccess !== 'function') return resources.Promisie.reject(new TypeError('ERROR: map expects onSuccess handler to be a function'));
        return resources.Promisie.map(data, concurrency, onSuccess);
      }, onFailure),
          success = _setHandlers3.success,
          failure = _setHandlers3.failure;

      return this.then(success, failure);
    };
  },
  each: function each(resources) {
    return function _each(onSuccess, onFailure, concurrency) {
      if (typeof onFailure === 'number') {
        concurrency = onFailure;
        onFailure = undefined;
      }

      var _setHandlers4 = setHandlers(function (data) {
        if (!Array.isArray(data)) return resources.Promisie.reject(new TypeError('ERROR: each expects input to be an array'));
        if (typeof onSuccess !== 'function') return resources.Promisie.reject(new TypeError('ERROR: each expects onSuccess handler to be a function'));
        return resources.Promisie.each(data, concurrency, onSuccess);
      }, onFailure),
          success = _setHandlers4.success,
          failure = _setHandlers4.failure;

      return this.then(success, failure);
    };
  },
  settle: function settle(resources) {
    return function _settle(onSuccess, onFailure) {
      var _setHandlers5 = setHandlers(function (data) {
        if (!Array.isArray(data)) return resources.Promisie.reject(new TypeError('ERROR: settle expects input to be an array'));
        if (typeof onSuccess !== 'function') return resources.Promisie.reject(new TypeError('ERROR: settle expects onSuccess handler to be a function'));
        var operations = data.map(function (d) {
          return function () {
            return onSuccess(d);
          };
        });
        return resources.Promisie.settle(operations);
      }, onFailure),
          success = _setHandlers5.success,
          failure = _setHandlers5.failure;

      return this.then(success, failure);
    };
  },
  retry: function retry(resources) {
    return function _retry(onSuccess, onFailure, options) {
      if ((typeof onFailure === 'undefined' ? 'undefined' : _typeof(onFailure)) === 'object') {
        options = onFailure;
        onFailure = undefined;
      }

      var _setHandlers6 = setHandlers(function (data) {
        if (typeof onSuccess !== 'function') return resources.Promisie.reject(new TypeError('ERROR: retry expects onSuccess handler to be a function'));
        return resources.Promisie.retry(function () {
          return onSuccess(data);
        }, options);
      }, onFailure),
          success = _setHandlers6.success,
          failure = _setHandlers6.failure;

      return this.then(success, failure);
    };
  },
  finally: function _finally(resources) {
    return function _finally(handler) {
      var _handler = function _handler() {
        return typeof handler === 'function' ? handler() : resources.Promisie.reject(new TypeError('ERROR: finally expects handler to be a function'));
      };
      return this.then(_handler, _handler);
    };
  }
};

module.exports = CHAINABLES;

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function (arr, concurrency) {
  var parts = [];
  while (arr.length) {
    var part = arr.splice(0, concurrency);
    parts.push(part);
  }
  return parts;
};

},{}],5:[function(require,module,exports){
'use strict';

module.exports = function (fn, evaluate) {
  var current = void 0;
  return regeneratorRuntime.mark(function doWhilst() {
    var invoked;
    return regeneratorRuntime.wrap(function doWhilst$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            invoked = fn();

            if (!(invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function')) {
              _context.next = 6;
              break;
            }

            _context.next = 4;
            return invoked.then(function (result) {
              current = result;
              return current;
            }, function (e) {
              return Promise.reject(e);
            });

          case 4:
            _context.next = 9;
            break;

          case 6:
            current = invoked;
            _context.next = 9;
            return current;

          case 9:
            if (evaluate(current)) {
              _context.next = 0;
              break;
            }

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, doWhilst, this);
  });
};

},{}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var series_generator = require('./series_generator');
var series_iterator = require('./iterator');
var divide = require('./divisions');
var chainables = require('./chainables');
var parallel_generator = require('./parallel_generator');
var settle_generator = require('./settle_generator');
var dowhilst_generator = require('./dowhilst_generator');
var retry_generator = require('./retry_generator');

var _series = function _series(operations, cb) {
  for (var i = 0; i < operations.length; i++) {
    if (typeof operations[i] !== 'function') return cb(new TypeError('ERROR: series can only be called with functions - argument ' + i + ': ' + operations[i]));
  }
  var operator = series_generator(operations);
  var iterate = series_iterator(operator, cb);
  iterate();
};

var _map = function _map(operations, concurrency, cb) {
  if (!Array.isArray(operations)) cb(new TypeError('ERROR: map can only be called with an Array'));
  cb = typeof concurrency === 'function' ? concurrency : cb;
  var operator = void 0;
  var iterate = void 0;
  if (!operations.length) return [];else {
    if (typeof concurrency !== 'number' || concurrency === 0) operator = series_generator([operations]);else {
      var divisions = divide(operations, concurrency);
      operator = series_generator(divisions);
    }
    iterate = series_iterator(operator, cb);
    iterate([]);
  }
};

var _settle = function _settle(fns) {
  var _this = this;

  try {
    var _ret = function () {
      var fulfilled = [];
      var rejected = [];
      fns[Symbol.iterator] = settle_generator(fns, fulfilled, rejected);
      return {
        v: _this.all(fns).then(function () {
          return { fulfilled: fulfilled, rejected: rejected };
        }, function (e) {
          return _this.reject(e);
        })
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } catch (e) {
    return this.reject(e);
  }
};

var _parallel = function _parallel(fns, args) {
  var _this2 = this;

  try {
    var _ret2 = function () {
      var result = {};
      fns[Symbol.iterator] = parallel_generator(fns, args, result);
      return {
        v: _this2.all(fns).then(function () {
          return result;
        }, function (e) {
          return _this2.reject(e);
        })
      };
    }();

    if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
  } catch (e) {
    return this.reject(e);
  }
};

var _dowhilst = function _dowhilst(fn, evaluate, cb) {
  try {
    var operator = dowhilst_generator(fn, evaluate)();
    var iterate = series_iterator(operator, cb);
    iterate();
  } catch (e) {
    cb(e);
  }
};

var _iterate = function _iterate(generator, cb) {
  var iterate = series_iterator(generator, cb);
  iterate();
};

var _retry = function _retry(fn, options, cb) {
  try {
    var operator = retry_generator.call(this, fn, options)();
    var iterate = series_iterator(operator, cb);
    iterate();
  } catch (e) {
    cb(e);
  }
};

var safe_assign = function safe_assign(data) {
  var result = {};
  for (var key in data) {
    var descriptor = Object.getOwnPropertyDescriptor(data, key);
    if (descriptor && descriptor.writable) result[key] = data[key];
  }
  return result;
};

var isGenerator = function isGenerator(val) {
  var generator = regeneratorRuntime.mark(function generator() {
    return regeneratorRuntime.wrap(function generator$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return true;

          case 2:
          case 'end':
            return _context.stop();
        }
      }
    }, generator, this);
  });
  var constructor = generator.constructor;
  return val.constructor === generator.constructor;
};

module.exports = {
  series_generator: series_generator,
  series_iterator: series_iterator,
  divide: divide,
  chainables: chainables,
  parallel_generator: parallel_generator,
  settle_generator: settle_generator,
  _series: _series,
  _map: _map,
  _parallel: _parallel,
  _settle: _settle,
  safe_assign: safe_assign,
  isGenerator: isGenerator,
  _dowhilst: _dowhilst,
  _iterate: _iterate,
  _retry: _retry
};

},{"./chainables":3,"./divisions":4,"./dowhilst_generator":5,"./iterator":7,"./parallel_generator":8,"./retry_generator":9,"./series_generator":10,"./settle_generator":11}],7:[function(require,module,exports){
'use strict';

var iterator = function iterator(generator, cb) {
  var _transform = void 0;
  return function iterate(state) {
    var current = void 0;
    try {
      current = generator.next(state);
    } catch (e) {
      cb(e);
    }
    if (!current) cb(new Error('ERROR: generator returned \'undefined\' value and is not iterable'));
    var _current = current,
        done = _current.done,
        value = _current.value;

    if (!done) {
      if (value && typeof value.then === 'function' && typeof value.catch === 'function') value.then(iterate, cb);else {
        (function () {
          var timeout = setTimeout(function () {
            iterate(value);
            clearTimeout(timeout);
          }, 0);
        })();
      }
    } else cb(null, value);
  };
};

module.exports = iterator;

},{}],8:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

module.exports = function (fns, args) {
  var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var index = 0;
  var keys = Object.keys(fns);
  return regeneratorRuntime.mark(function parallel() {
    var _this = this;

    var _loop;

    return regeneratorRuntime.wrap(function parallel$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _loop = regeneratorRuntime.mark(function _loop() {
              var currentIndex, invoked;
              return regeneratorRuntime.wrap(function _loop$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      currentIndex = index++;

                      if (!(typeof fns[keys[currentIndex]] !== 'function')) {
                        _context.next = 7;
                        break;
                      }

                      result[keys[currentIndex]] = fns[keys[currentIndex]];
                      _context.next = 5;
                      return fns[keys[currentIndex]];

                    case 5:
                      _context.next = 16;
                      break;

                    case 7:
                      invoked = Array.isArray(args) ? fns[keys[currentIndex]].apply(fns, _toConsumableArray(args)) : fns[keys[currentIndex]](args);

                      if (!(invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function')) {
                        _context.next = 13;
                        break;
                      }

                      _context.next = 11;
                      return invoked.then(function (value) {
                        result[keys[currentIndex]] = value;
                        return value;
                      }, function (e) {
                        return Promise.reject(e);
                      });

                    case 11:
                      _context.next = 16;
                      break;

                    case 13:
                      result[keys[currentIndex]] = invoked;
                      _context.next = 16;
                      return invoked;

                    case 16:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _loop, _this);
            });

          case 1:
            if (!(index < keys.length)) {
              _context2.next = 5;
              break;
            }

            return _context2.delegateYield(_loop(), 't0', 3);

          case 3:
            _context2.next = 1;
            break;

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, parallel, this);
  });
};

},{}],9:[function(require,module,exports){
'use strict';

var TIMEOUT = function TIMEOUT(Promisie) {
  var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  return new Promisie(function (resolve) {
    var _timeout = setTimeout(function () {
      clearTimeout(_timeout);
      resolve();
    }, time);
  });
};

module.exports = function (fn, options) {
  var Promisie = this;
  var current = void 0;
  var isFirst = true;
  var times = options.times,
      timeout = options.timeout;

  return regeneratorRuntime.mark(function retry() {
    var invoked;
    return regeneratorRuntime.wrap(function retry$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            times--;
            invoked = isFirst || typeof timeout !== 'number' || timeout === 0 ? fn() : function () {
              return TIMEOUT(Promisie, timeout).then(fn).catch(function (e) {
                return Promise.reject(e);
              });
            }();

            isFirst = false;

            if (!(invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function')) {
              _context.next = 8;
              break;
            }

            _context.next = 6;
            return invoked.then(function (result) {
              current = result;
              return current;
            }, function (e) {
              current = { __isRejected: true, e: e };
              return current;
            });

          case 6:
            _context.next = 11;
            break;

          case 8:
            current = invoked;
            _context.next = 11;
            return current;

          case 11:
            if (times && current && current.__isRejected) {
              _context.next = 0;
              break;
            }

          case 12:
            return _context.abrupt('return', current);

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, retry, this);
  });
};

},{}],10:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var handleMap = function handleMap(arr, state) {
  return arr.map(function (operation) {
    var clone = (typeof state === 'undefined' ? 'undefined' : _typeof(state)) === 'object' ? Array.isArray(state) ? Object.assign([], state) : Object.assign({}, state) : state;
    if (typeof operation === 'function') return operation(clone);else return operation;
  });
};

module.exports = regeneratorRuntime.mark(function series(fns) {
  var current, state, resolved;
  return regeneratorRuntime.wrap(function series$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          current = void 0;
          state = void 0;

        case 2:
          if (!fns.length) {
            _context.next = 16;
            break;
          }

          current = fns.shift();

          if (!Array.isArray(current)) {
            _context.next = 11;
            break;
          }

          resolved = Promise.all(handleMap(current, state)).then(function (result) {
            return Array.isArray(state) ? state.concat(result) : result;
          }).catch(function (e) {
            return Promise.reject(e);
          });
          _context.next = 8;
          return resolved;

        case 8:
          state = _context.sent;
          _context.next = 14;
          break;

        case 11:
          _context.next = 13;
          return current(state);

        case 13:
          state = _context.sent;

        case 14:
          _context.next = 2;
          break;

        case 16:
          return _context.abrupt('return', state);

        case 17:
        case 'end':
          return _context.stop();
      }
    }
  }, series, this);
});

},{}],11:[function(require,module,exports){
'use strict';

module.exports = function (fns) {
  var fulfilled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var rejected = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  var index = 0;
  return regeneratorRuntime.mark(function settle() {
    var _this = this;

    var _loop;

    return regeneratorRuntime.wrap(function settle$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _loop = regeneratorRuntime.mark(function _loop() {
              var currentIndex, invoked;
              return regeneratorRuntime.wrap(function _loop$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      currentIndex = index++;

                      if (!(typeof fns[currentIndex] !== 'function')) {
                        _context.next = 7;
                        break;
                      }

                      fulfilled.push({ value: fns[currentIndex], index: currentIndex, status: 'fulfilled' });
                      _context.next = 5;
                      return fns[currentIndex];

                    case 5:
                      _context.next = 16;
                      break;

                    case 7:
                      invoked = fns[currentIndex]();

                      if (!(invoked && typeof invoked.then === 'function' && typeof invoked.catch === 'function')) {
                        _context.next = 13;
                        break;
                      }

                      _context.next = 11;
                      return invoked.then(function (value) {
                        fulfilled.push({ value: value, index: currentIndex, status: 'fulfilled' });
                        return value;
                      }, function (e) {
                        rejected.push({ value: e, index: currentIndex, status: 'rejected' });
                        return null;
                      });

                    case 11:
                      _context.next = 16;
                      break;

                    case 13:
                      fulfilled.push({ value: invoked, index: currentIndex, status: 'fulfilled' });
                      _context.next = 16;
                      return invoked;

                    case 16:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _loop, _this);
            });

          case 1:
            if (!(index < fns.length)) {
              _context2.next = 5;
              break;
            }

            return _context2.delegateYield(_loop(), 't0', 3);

          case 3:
            _context2.next = 1;
            break;

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, settle, this);
  });
};

},{}]},{},[1]);
