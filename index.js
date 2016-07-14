'use strict';

class Promisie extends Promise {
  static promisify (fn, receiver){
    if (!fn || typeof fn !== 'function') throw new TypeError('ERROR: promisify must be called with a function');
    return (...args) => new Promisie((resolve, reject) =>{
      args.push(function(err, data){
        if (err) reject(err);
        else resolve(data);
      });
      Reflect.apply(fn, receiver, args);
    });
  }

  static depromisify (fn){
    if (!fn || typeof fn !== 'function') throw new TypeError('ERROR: depromisify must be called with a function');
    return function(...args){
      const cb = args.pop();
      Promisie
        .resolve(fn)
        .then(trustedFn=>trustedFn(...args))
        .then(data=>cb(null, data))
        .catch(err=>cb(err));
    }
  }

  static promisifyAll (mod, _this){
    if (mod && typeof mod === 'object'){
      let promisified = Object.create(mod);
      promisified = Object.assign((promisified && typeof promisified === 'object') ? promisified : {}, mod);
      Object.keys(promisified).forEach(key =>{
        if (typeof promisified[key] === 'function') promisified[key + 'Async'] = (_this) ? this.promisify(promisified[key]).bind(_this) : this.promisify(promisified[key]);
        if (promisified[key] && typeof promisified[key] === 'object') promisified[key] = this.promisifyAll(promisified[key], _this);
      });
      return promisified;
    }
    else throw new TypeError('ERROR: promisifyAll must be called with an object or array');
  }

  try
  (onSuccess, onFailure){
    return this.then(data =>{
      try {
        return (typeof onSuccess === 'function') ? onSuccess(data) : null;
      }
      catch (e) {
        return Promisie.reject(e);
      }
    }, e => (typeof onFailure === 'function') ? onFailure(e) : null);
  }
}

module.exports = Promisie;