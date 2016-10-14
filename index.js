'use strict';
const UTILITY = require('./utility/index');

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
    for (let key in UTILITY.chainables) {
      this[key] = UTILITY.chainables[key]({ Promisie });
    }
  }
  /**
   * @static promisify static method
   * @param {Function} fn Async function that expects a callback
   * @param {*} [_this=] Optional "this" that will be bound to the promisified function 
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
   * @param {Object|*[]} mod An object or array containing functions to be promisified non-functions can be included an will be skipped
   * @param {*} [_this=] Optional "this" that will be bound to all promisified functions
   * @param {Object} [options={recursive:false,readonly:true}] Options for the execution of promisifyAll
   * @param {boolean} options.recursive If true promisifyAll will recursively promisify functions inside of child objects
   * @param {boolean} options.readonly If true promisifyAll will ensure that property is writable before trying to re-assign
   * @return {Object|*[]} Returns a clone of original object or array with promisified functions
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
    return Promisie.promisify(UTILITY._series)(operations);
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
     * @param {*...} Accepts any arguments
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
  static map (datas, concurrency, fn) {
    if (typeof concurrency === 'function') {
      fn = concurrency;
      concurrency = undefined;
    }
    let operations = datas.map(data => fn(data));
    return Promisie.promisify(UTILITY._map)(operations, concurrency);
  }
  static each (datas, concurrency, fn) {
    return Promisie.map(datas, concurrency, fn)
      .then(() => datas, e => Promise.reject(e));
  }
  static parallel (fns, args) {
    if (Array.isArray(fns)) return Promisie.all(fns);
    else return UTILITY._parallel.call(Promisie, fns, args);
  }
  static settle (fns) {
    return UTILITY._settle.call(Promisie, fns);
  }
  static compose (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    for (let i = 0; i < operations.length; i++) {
      if (typeof operations[i] !== 'function') throw new TypeError(`ERROR: compose can only be called with functions - argument ${i}: ${operations[i]}`);
    }
    operations = operations.reverse();
    return Promisie.pipe(operations);
  }
  static all () {
    let argv = [...arguments];
    if (argv.length === 1 && Array.isArray(argv[0])) return super.all(argv[0]);
    else if (argv.length === 1 && typeof argv[0][Symbol.iterator] === 'function') return super.all([...argv[0]]);
    else return super.all([...arguments]);
  }
}

module.exports = Promisie;