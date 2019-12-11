'use strict';
const UTILITY = require('./legacy_src/index');
const CHAINABLES = UTILITY.chainables;
/**
 * Promisie inherits from the Promise class and adds helpful chainble methods
 * @class Promisie
 * @extends {Promise}
 */
class Promisie extends Promise {
  /**
   * @constructor {Function} Constructor for Promisie class
   * @param {Object} options Passes options to Promise constructor
   * @return {Object} Returns instance of Promisie
   */
  constructor (options) {
    super(options);
    for (let key in CHAINABLES) {
      this[key] = CHAINABLES[key]({ Promisie: Promisie });
    }
  }
  /**
   * @static promisify static method
   * @param {Function} fn Async function that expects a callback
   * @param {*} [_this] Optional "this" that will be bound to the promisified function 
   * @return {Function} Returns a promisifed function which returns a Promise
   */
	static promisify (fn, _this) {
	  if (typeof fn !== 'function') throw new TypeError('ERROR: promisify must be called with a function');
	  else {
	  	let promisified = function () {
        let args = [...arguments];
        return new Promisie((resolve, reject) => {
          args.push(function(err, data) {
            if (err) reject(err);
            else resolve(data);
          });
          fn.apply(this, args);
        });
      };
	  	if (_this) return promisified.bind(_this);
      else return promisified;
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
  static promisifyAll (mod, _this, options = { recursive: false, readonly: true }) {
  	if (mod && typeof mod === 'object') {
      let promisified = Object.create(mod);
      if (!options.readonly) promisified = Object.assign((promisified && typeof promisified === 'object') ? promisified : {}, mod);
      else promisified = UTILITY.safe_assign(mod);
	  	Object.keys(promisified).forEach(key => {
        if (typeof promisified[key] === 'function') promisified[key + 'Async'] = (_this) ? this.promisify(promisified[key]).bind(_this) : this.promisify(promisified[key]);
        if ((typeof options === 'boolean' && options) || (options && options.recursive)) {
          if (promisified[key] && typeof promisified[key] === 'object') promisified[key] = this.promisifyAll(promisified[key], _this, options);
        }
	  	});
  		return promisified;
  	}
  	else throw new TypeError('ERROR: promisifyAll must be called with an object or array');
  }
  /**
   * @static series static method
   * @param {Array|Object} fns An array or iterable object containing functions that will be run in series
   * @return {Object} Returns an instance of Promisie which resolves after the series finishes execution
   */
  static series (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    let handlesSyncErrors = (process && process.version && process.version.node) ? (Number(process.version.node.split('.')[0]) > 6) : false;
    return Promisie.promisify(UTILITY._series)((handlesSyncErrors) ? operations : operations.map(operation => {
      return function () {
        try {
          return operation(...arguments);
        }
        catch (e) {
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
  static pipe (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    for (let i = 0; i < operations.length; i++) {
      if (typeof operations[i] !== 'function') throw new TypeError(`ERROR: pipe can only be called with functions - argument ${i}: ${operations[i]}`);
    }
    /**
     * Pipe function that is returned by static method will run series when called and pass all arguments to first function in series
     * @param {...*} Accepts any arguments
     * @return {Object} Returns an instance of Promisie which resolves once series finished execution
     */
    return function pipe () {
      let argv = arguments;
      let _operations = Object.assign([], operations);
      let first = _operations[0];
      _operations[0] = function () {
        return first(...argv);
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
  static map (datas, concurrency, fn) {
    if (typeof concurrency === 'function') {
      fn = concurrency;
      concurrency = undefined;
    }
    return Promisie.promisify(UTILITY._map)(fn, datas, concurrency);
  }
  /**
   * @static each static method
   * @param {*} datas An array of data to be used as first argument in iterator function
   * @param {number} [concurrency] Optional concurrency limit
   * @param {Function} fn Iterator function for each if concurrency isn't passed it fn can be passed as second argument
   * @return {Object} Returns and instance of Promisie which resolves with original datas argument
   */
  static each (datas, concurrency, fn) {
    return Promisie.map(datas, concurrency, fn)
      .then(() => datas, e => Promisie.reject(e));
  }
  /**
   * @static parallel static method
   * @param {Object|Function[]} fns Array of functions or object containing functions. If an object will resolve to an object with matching keys mapped to resolve values
   * @param {*} args An array of arguments or a single argument that will be passed to each function being run in parallel
   * @param {Object} [options={recursive: false}] Options for the execution of parallel
   * @param {boolean} [options.recursive=false] If true parallel will resolve nested objects
   * @return {Object} Returns and instance of Promisie which resolves after parallel operations are complete
   */
  static parallel (fns, args, options = { recursive: false }) {
    if (options.recursive === true) fns = UTILITY._handleRecursiveParallel.call(Promisie, fns);
    return UTILITY._parallel.call(Promisie, fns, args);
  }
  /**
   * @static settle static method
   * @param {Function[]|Object} fns An array of functions or object containing functions
   * @return {Object} Returns a Promisie which resolves with an object containing a "fulfilled" and "rejected" property. Almost always resolves rejected promises will be in "rejected" array and resolved will be in "fulfilled" array
   */
  static settle (fns) {
    return UTILITY._settle.call(Promisie, fns);
  }
  /**
   * @static compose static method
   * @param {Function[] fns An array of functions that will be compiled into pipe
   * @return {Function} Almost the exact same functionality as Promisie.pipe except fns are reversed before being compiled into pipe
   */
  static compose (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    for (let i = 0; i < operations.length; i++) {
      if (typeof operations[i] !== 'function') throw new TypeError(`ERROR: compose can only be called with functions - argument ${i}: ${operations[i]}`);
    }
    operations = operations.reverse();
    return Promisie.pipe(operations);
  }
  /**
   * @static all static method
   * @param {Object[]|...Object|Object} argument An array of unresolved Promises, or an argument list comprised of unresolved Promises, or an iterable object containing unresolved Promises
   * @return {Object} Returns and instance of Promise which resolves once all Promises have resolved
   */
  static all () {
    let argv = [...arguments];
    if (argv.length === 1 && Array.isArray(argv[0])) return super.all(argv[0]);
    else if (argv.length === 1 && typeof argv[0][Symbol.iterator] === 'function') return super.all([...argv[0]]);
    else return super.all([...arguments]);
  }
  /**
   * @static iterate static method
   * @param {Function} generator An uninitialized generator function
   * @param {*} initial An initial value to be passed to the generator
   * @return {Object} Returns a Promisie which resolves once generator has yielded its last value
   */
  static iterate (generator, initial) {
    let isGenerator = UTILITY.isGenerator(generator);
    if (!isGenerator) throw new TypeError(`ERROR: iterate can only be called with generators - argument: ${ generator.constructor }`);
    let initialized = generator(initial);
    return Promisie.promisify(UTILITY._iterate)(initialized);
  }
  /**
   * @static doWhilst static method
   * @param {Function} fn Iterator function that will be called until evalution returns false
   * @param {Function} evaluate An evaluation function that is run after each iteration of fn resolves. If evaluate returns true iterator will be called again
   * @return {Object} Returns a Promisie which resolves once evaluate function return false
   */
  static doWhilst (fn, evaluate) {
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
  static retry (fn, options = { times: 3, timeout: 0 }) {
    if (typeof fn !== 'function') throw new TypeError('ERROR: retry expects that fn is a function');
    return Promisie.promisify(UTILITY._retry, Promisie)(fn, options)
      .then(val => {
        if (val.__isRejected) return Promisie.reject(val.e);
        return val;
      }, e => Promisie.reject(e));
  }
}

module.exports = Promisie;