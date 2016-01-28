'use strict';

class Promisie extends Promise {
	static promisify(fn, _this) {
	  if (typeof fn !== 'function') throw new TypeError('ERROR: promisify must be called with a function');
	  else {
	  	let promisified = function () {
        let args = [];
        for (var key in arguments) {
        	if (arguments.hasOwnProperty(key)) args.push(arguments[key]);
        }
        return new Promise((resolve, reject) => {
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
  static promisifyAll(mod, _this) {
  	if (mod && typeof mod === 'object') {
  		let promisified = mod;
	  	Object.keys(mod).forEach(key => {
	  		if (typeof mod[key] === 'function') promisified[key + 'Async'] = (_this) ? this.promisify(mod[key]).bind(_this) : this.promisify(mod[key]);
	  	});
  		return promisified;
  	}
  	else throw new TypeError('ERROR: promisifyAll must be called with an object or array');
  }
}

module.exports = Promisie;