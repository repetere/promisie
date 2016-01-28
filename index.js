'use strict';

class Promisie extends Promise {
	static promisify(fn) {
	  if (typeof fn !== 'function') {
	      throw new TypeError('ERROR: promisify must be called with a function');
	  } 
	  else {
      return function() {
        let args = [];
        for (var key in arguments) {
            if (arguments.hasOwnProperty(key)) {
                args.push(arguments[key]);
            }
        }
        return new Promise(function(resolve, reject) {
          args.push(function(err, data) {
            if (err) reject(err);
            else resolve(data);
          });
          fn.apply(null, args);
        });
      };
	  }
  }
  static promisifyAll(mod) {
  	if (mod && typeof mod === 'object') {
  		let promisified = mod;
	  	Object.keys(mod).forEach(key => {
	  		if (typeof mod[key] === 'function') {
	  			promisified[key + 'Async'] = this.promisify(mod[key]);
	  		}
	  	});
  		return promisified;
  	}
  	else {
  		throw new TypeError('ERROR: promisifyAll must be called with an object or array');
  	}
  }
}

module.exports = Promisie;