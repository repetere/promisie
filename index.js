'use strict';
var utility = require('./utility/index');

var _series = function (operations, cb) {
  for (let i = 0; i < operations.length; i++) {
    if (typeof operations[i] !== 'function') return cb(new TypeError(`ERROR: series can only be called with functions - argument ${i}: ${operations[i]}`));
  }
  let operator = utility.series_generator(operations);
  let iterate = utility.series_iterator(operator, cb);
  iterate();
};

class Promisie extends Promise {
  constructor (options) {
    super(options);
    this.try = (onSuccess, onFailure) => {
      return super.then(data => {
        try {
          return (typeof onSuccess === 'function') ? onSuccess(data) : null;
        }
        catch (e) {
          return Promise.reject(e);
        }
      }, e => (typeof onFailure === 'function') ? onFailure(e) : null);
    };
  }
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
  static promisifyAll (mod, _this) {
  	if (mod && typeof mod === 'object') {
  		let promisified = Object.create(mod);
      promisified = Object.assign((promisified && typeof promisified === 'object') ? promisified : {}, mod);
	  	Object.keys(promisified).forEach(key => {
	  		if (typeof promisified[key] === 'function') promisified[key + 'Async'] = (_this) ? this.promisify(promisified[key]).bind(_this) : this.promisify(promisified[key]);
        if (promisified[key] && typeof promisified[key] === 'object') promisified[key] = this.promisifyAll(promisified[key], _this); 
	  	});
  		return promisified;
  	}
  	else throw new TypeError('ERROR: promisifyAll must be called with an object or array');
  }
  static series (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    return Promisie.promisify(_series)(operations);
  }
  static pipe (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    for (let i = 0; i < operations.length; i++) {
      if (typeof operations[i] !== 'function') throw new TypeError(`ERROR: pipe can only be called with functions - argument ${i}: ${operations[i]}`);
    }
    return function () {
      let argv = arguments;
      let _operations = Object.assign([], operations);
      let first = _operations[0];
      _operations[0] = function () {
        return first(...argv);
      };
      return Promisie.promisify(_series)(_operations);
    };
  }
  static compose (fns) {
    let operations = (Array.isArray(fns)) ? fns : [...arguments];
    for (let i = 0; i < operations.length; i++) {
      if (typeof operations[i] !== 'function') throw new TypeError(`ERROR: compose can only be called with functions - argument ${i}: ${operations[i]}`);
    }
    operations = operations.reverse();
    return Promisie.pipe(operations);
  }
}

utility = utility(Promisie);

module.exports = Promisie;