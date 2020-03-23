
import Promisie from './index';
import fs from 'fs';
import moment from 'moment';

function asyncfn(time: number, val:any) {
	return function<T>() {
		return new Promisie<T>(resolve => {
			setTimeout(function () {
				resolve(val);
			}, time);
		});
	};
};

describe('Promisie test', () => {
  describe('basic assumptions', () => {
    it('Should be a constructor function', function () {
			expect(typeof Promisie === 'function').toBeTruthy
		});
		it('Should have methods promisify and promisifyAll', function () {
			expect(typeof Promisie.promisify).toEqual('function')
			expect(typeof Promisie.promisifyAll).toEqual('function');
		});
		it('Should return an instance of a promise if called with "new" keyword', function () {
			let a = new Promisie(function () { });
			expect(a instanceof Promise).toBeTruthy
		});
		it('Should be chainable if a new Promisie is returned', function () {
			let a = function () {
				return new Promise(function (resolve, reject) {
					resolve();
				});
			};
			expect(typeof a().then).toEqual('function');
		});
  });

  describe('Basic static method tests', function () {
		describe('promisify functionality', function () {
			it('Should return a function when called with a function', function () {
				let a = function () {
					return;
				};
				expect(typeof Promisie.promisify(a)).toEqual('function');
			});
		});
		describe('promisifyAll functionality', function () {
			it('Should return an object with Async methods when called with an object or array', function () {
				let a = {
					b: function () {
						return;
					},
					c: function () {
						return;
					}
				},
					fns = Promisie.promisifyAll(a);
				expect(typeof fns.bAsync).toEqual('function');
				expect(typeof fns.cAsync).toEqual('function');
			});
		});
  });
  
  describe('Static method testing with async functions', function () {
		let a = function (str, cb) {
			setTimeout(function () {
				if (str instanceof Error) {
					cb(str);
				}
				else {
					cb(null, str);
				}
			}, 200);
		},
			b = {
				c: function (str, cb) {
					setTimeout(function () {
						if (str instanceof Error) {
							cb(str);
						}
						else {
							cb(null, str);
						}
					}, 200);
				},
				d: function (str, cb) {
					setTimeout(function () {
						if (str instanceof Error) {
							cb(str);
						}
						else {
							cb(null, str);
						}
					}, 400);
				},
				e: 'e',
				f: {
					g: function (str, cb) {
						setTimeout(function () {
							if (str instanceof Error) {
								cb(str);
							}
							else {
								cb(null, str);
							}
						}, 400);
					}
				}
			},
			testConstructor = function (str) {
				this.msg = str;
				this.log = function (cb) {
					setTimeout(() => {
						cb(null, this.msg);
					}, 200);
				};
			},
			f = new testConstructor('hello');
		describe('promisify functionality', function () {
			let test = Promisie.promisify(a);
			it('Should return a function that returns and instance of a Promise', function () {
				expect(test('') instanceof Promise).toBeTruthy;
			});
			it('Should be chainable and resolve the promisified function', function (done) {
				test('hello')
					.then(msg => {
						expect(msg).toEqual('hello');
						done();
					});
			});
			it('Should fall into catch block if promisified function is rejected', function (done) {
				test(new Error('Test Error'))
					.then(msg => { })
					.catch(e => {
						expect(e instanceof Error).toBeTruthy;
						done();
					});
			});
			it('Should be able to promisify prototype metods if "this" is passed as second argument', function (done) {
				let test = Promisie.promisify(f.log, f);
				test().then(msg => {
					expect(msg).toEqual('hello');
					done();
				});
			});
		});
		describe('promisifyAll functionality', function () {
      let test = Promisie.promisifyAll(b, undefined, { recursive: true, readonly: false });
			it('Should return Async methods that are instances of Promises', function () {
				expect(test.cAsync('') instanceof Promise).toBeTruthy;
				expect(test.dAsync('') instanceof Promise).toBeTruthy;
				expect(test.eAsnyc).toEqual(undefined);
				expect(typeof test.f).toEqual('object');
				expect(test.f.gAsync('') instanceof Promise).toBeTruthy;
			});
			it('Async methods should be chainable', function (done) {
				test.cAsync('hello')
					.then(msg => {
						expect(msg).toEqual('hello');
						return test.dAsync('world');
					})
					.then(msg => {
						expect(msg).toEqual('world');
						done();
					});
			}, 1000);
			it('Should fall into catch block if promisified function is rejected', function (done) {
				test.cAsync(new Error('Test Error'))
					.then(msg => { })
					.catch(e => {
						expect(e instanceof Error).toBeTruthy;
						done();
					});
			});
			it('Should be able to promisifyAll on core node modules', function (done) {
				try {
					let fsAsync = Promisie.promisifyAll(fs, undefined, { recursive: false, readonly: true });
					expect(typeof fsAsync).toEqual('object');
					expect(typeof fsAsync.readFileAsync).toEqual('function');
					done();
				}
				catch (e) {
					done(e);
				}
			});
		});
  });
  
  describe('Static method series testing', function () {
		it('Should be able to run a series of async functions', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 25);
					});
				};
			});
			Promisie.series<number>(asyncfns)
				.then(result => {
					expect(result).toEqual(15);
					done();
				}, done);
    }, 1500);
    it('Should be able to handle an array of arrays', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return [function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i * 2);
						}, i * 25);
					});
				}];
			});
			Promisie.series<number[]>(asyncfns)
				.then(result => {
					expect(result).toStrictEqual([2, 4, 6, 8, 10]);
					done();
				}, done);
		}, 1500);
		it('Should be able to run a series containing sync functions', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 25);
					});
				};
			});
			asyncfns[2] = (val) => 3 + val;
			Promisie.series<number>(asyncfns)
				.then(result => {
					expect(result).toEqual(15);
					done();
				}, done);
		}, 1500);
		it('Should handle an error in one of the functions in the series if all functions are async', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							if (i === 3) reject(i);
							else resolve(i + (val || 0));
						}, i * 25);
					});
				};
			});
			Promisie.series(asyncfns)
				.then(() => {
					done(new Error('Should have rejected with an error'));
				}, e => {
					expect(e).toEqual(3);
					done();
				});
		}, 1500);
		it('Should handle an error in one of the functions in the series if all functions are sync', done => {
			const syncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					if (i === 3) throw i;
					else return i + (val || 0);
				};
			});
			Promisie.series(syncfns)
				.then(() => {
					done(new Error('Should have rejected with an error'));
				}, e => {
					expect(e).toEqual(3);
					done();
				});
		});
  });
  
  describe('.try method testing', function () {
		it('Should be chainable', done => {
			(function () {
				return new Promisie((resolve) => {
					setTimeout(function () {
						resolve();
					}, 250);
				});
			})()
				.then(() => {
					return new Promisie((resolve) => {
						setTimeout(function () {
							resolve();
						}, 100);
					});
				})
				.try(() => {
					return new Promisie((resolve) => {
						setTimeout(function () {
							resolve('hello');
						}, 100);
					});
				})
				.then(data => {
					expect(data).toEqual('hello');
					done();
				})
				.catch(done);
		});
		it('Should handle an error', done => {
			(function () {
				return new Promisie((resolve) => {
					setTimeout(function () {
						resolve();
					}, 250);
				});
			})()
				.try(() => {
					throw new Error('test error');
				})
				.then(() => {
					done(new Error('Should not get here'));
				})
				.catch(e => {
					expect(e instanceof Error).toBeTruthy;
					expect(e.message).toEqual('test error');
					done();
				});
		});
  });
  
  describe('Static method pipe and compose testing', function () {
		it('Pipe should return a function that will pass arguments to the first function in a series', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 25);
					});
				};
			});
			const pipe = Promisie.pipe<number>(asyncfns);
			pipe(5)
				.then(result => {
					expect(result).toEqual(20);
					done();
				})
				.catch(done);
		});
		it('Compose should reverse and return a function that will pass arguments to the first function in a series', done => {
			const asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 25);
					});
				};
			});
			const compose = Promisie.compose<number>(asyncfns);
			compose(5)
				.try(result => {
					expect(result).toEqual(20);
					done();
				})
				.catch(done);
		});
  });
  
  describe('.map method testing', function () {
		const arr = [1, 2, 3, 4, 5];
		it('Should resolve with fully resolved array if concurrency isn\'t passed', done => {
			Promisie.map<number>(arr, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val);
						clearTimeout(timeout);
					}, 25);
				});
			})
				.then(resolved => {
					expect(resolved).toStrictEqual(arr);
					done();
				})
				.catch(done);
		});
		it('Should handle rejection when concurrency isn\'t passed', done => {
			Promisie.map(arr, val => {
				return new Promise((resolve, reject) => {
					let timeout = setTimeout(() => {
						reject(val);
						clearTimeout(timeout);
					}, 100);
				});
			})
				.then(val => {
					done(new Error('Should not get here'));
				}, e => {
					expect(e).toEqual(1);
					done();
				});
		});
		it('Should resolve after running operations with a concurrency limit', done => {
			Promisie.map<number>(arr, 2, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val);
						clearTimeout(timeout);
					}, 100);
				});
			})
				.try(resolved => {
					expect(resolved).toStrictEqual(arr);
					done();
				})
				.catch(done);
		});
		it('Should also be a chainable method', done => {
			const mapfn = asyncfn(25, [1, 2, 3]);
			mapfn<number>()
				.map(function (data) {
					return asyncfn(25, data + 1)();
				})
				.then(result => {
					expect(result).toStrictEqual([2, 3, 4]);
					done();
				}, done);
		});
		it('Should be able to handle concurrency when using chainable method', done => {
			let mapfn = asyncfn(25, [1, 2, 3, 4, 5]);
			let startTime = moment();
			mapfn<number>()
				.map(function (data) {
					return asyncfn(25, data + 1)();
				}, 2)
				.try(result => {
					let diff = moment().diff(startTime);
					expect(result).toStrictEqual([2, 3, 4, 5, 6]);
					expect(diff > 500).toBeTruthy;
					done();
				})
				.catch(done);
		});
  });
  
  describe('.each method testing', function () {
		const arr = [1, 2, 3, 4, 5];
		it('Should resolve with fully resolved array if concurrency isn\'t passed', done => {
			Promisie.each<number>(arr, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val + 1);
						clearTimeout(timeout);
					}, 25);
				});
			})
				.try(resolved => {
					expect(resolved).toStrictEqual(arr);
					done();
				})
				.catch(done);
		});
		it('Should handle rejection when concurrency isn\'t passed', done => {
			Promisie.each<number>(arr, val => {
				return new Promise((resolve, reject) => {
					let timeout = setTimeout(() => {
						reject(val);
						clearTimeout(timeout);
					}, 100);
				});
			})
				.then(val => {
					done(new Error('Should not get here'));
				}, e => {
					expect(e).toEqual(1);
					done();
				});
		});
		it('Should resolve after running operations with a concurrency limit', done => {
			Promisie.each<number>(arr, 2, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val + 1);
						clearTimeout(timeout);
					}, 100);
				});
			})
				.try(resolved => {
					expect(resolved).toStrictEqual(arr);
					done();
				})
				.catch(done);
		});
		it('Should also be a chainable method', done => {
			const eachfn = asyncfn(25, [1, 2, 3]);
			eachfn<number>()
				.each(function (data) {
					return asyncfn(25, data + 1)();
				})
				.then(result => {
					expect(result).toStrictEqual([1, 2, 3]);
					done();
				}, done);
		});
		it('Should be able to handle concurrency when using chainable method', done => {
			let eachfn = asyncfn(25, [1, 2, 3, 4, 5]);
			let startTime = moment();
			eachfn<number>()
				.each(function (data) {
					return asyncfn(25, data + 1)();
				}, 2)
				.try(result => {
					let diff = moment().diff(startTime);
					expect(result).toStrictEqual([1, 2, 3, 4, 5]);
					expect(diff > 500).toBeTruthy;
					done();
				})
				.catch(done);
		});
  });
  
  describe('.spread method testing', function () {
		it('Should spread any iterable value so the next function is called with the array values as arguments', done => {
			const arr_resolver = asyncfn(25, [1, 2, 3]);
			arr_resolver<number>()
				.spread(function (val1: number, val2: number, val3: number) {
					expect([val1, val2, val3]).toStrictEqual([1, 2, 3]);
					done();
				})
				.catch(done);
		});
		it('Should be chainable', done => {
			let arr_resolver = asyncfn(250, [1, 2, 3]);
			arr_resolver<number>()
				.then(result => result)
				.spread(function (one, two, three) {
					expect([one, two, three]).toStrictEqual([1, 2, 3]);
					done();
				})
				.catch(done);
		});
  });
  
  describe('.parallel static method testing', function () {
		it('Should resolve an object in parallel', done => {
			const operations = {
				'hello': asyncfn(25, 'world'),
				'foo': asyncfn(50, 'bar')
			};
			Promisie.parallel<string>(operations)
				.try(result => {
					expect(result).toStrictEqual({ hello: 'world', 'foo': 'bar' });
					done();
				})
				.catch(done);
    });
    it('Should resolve an object in parallel with concurrency', done => {
			const operations = {
				'hello': asyncfn(25, 'world'),
				'foo': asyncfn(50, 'bar')
			};
			Promisie.parallel<string>(operations, { concurrency: 1 })
				.try(result => {
					expect(result).toStrictEqual({ hello: 'world', 'foo': 'bar' });
					done();
				})
				.catch(done);
		});
		it('Should handle sync functions', done => {
			let operations = {
				'hello': asyncfn(25, 'world'),
				'foo': asyncfn(50, 'bar'),
				'fizz': () => 'boom'
			};
			Promisie.parallel(operations)
				.try(result => {
					expect(result).toStrictEqual({ hello: 'world', 'foo': 'bar', fizz: 'boom' });
					done();
				})
				.catch(done);
		});
		it('Should handle non-function values', done => {
			let operations = {
				'hello': asyncfn(25, 'world'),
				'foo': asyncfn(50, 'bar'),
				'fizz': 'boom'
			};
			Promisie.parallel(operations)
				.try(result => {
					expect(result).toStrictEqual({ hello: 'world', 'foo': 'bar', fizz: 'boom' });
					done();
				})
				.catch(done);
		});
		it('Should handle arrays', done => {
			let operations = [asyncfn(25, 'world'), asyncfn(50, 'bar')];
			Promisie.parallel(operations)
				.try(result => {
					expect(result).toStrictEqual({ 0: 'world', 1: 'bar' });
					done();
				})
				.catch(done);
		});
		it('Should handle child objects if recursive options is set to true', done => {
			let operations = {
				foo: {
					bar: asyncfn(25, 'foobar')
				},
				hello: {
					world: {
						hi: asyncfn(25, 'helloworld')
					}
				},
				standard: asyncfn(50, 'operation')
			};
			Promisie.parallel(operations, null, { recursive: true })
				.try(result => {
					expect(result).toStrictEqual({
						foo: {
							bar: 'foobar'
						},
						hello: {
							world: {
								hi: 'helloworld'
							}
						},
						standard: 'operation'
					});
					done();
				})
				.catch(done);
		});
		it('Should handle rejections', done => {
			let operations = {
				'hello': asyncfn(250, 'world'),
				'foo': () => Promise.reject(new Error('Some Error'))
			};
			Promisie.parallel(operations)
				.then(() => {
					done(new Error('Should not resolve'));
				}, e => {
					expect(e instanceof Error).toBeTruthy;
					done();
				});
		});
  });
  
  describe('.settle method testing', function () {
		it('Should always resolve and show rejected/resolved promises', done => {
			const asyncfns = [asyncfn(50, true), function () {
				return new Promise((resolve, reject) => {
					setTimeout(function () {
						reject(new Error('There was an error'));
					}, 25);
				});
			}];
			Promisie.settle<boolean>(asyncfns)
				.try(result => {
					expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(1);
					expect(result.fulfilled.length).toEqual(1);
					done();
				}, done);
    });
    it('Should always resolve and show rejected/resolved promises with concurrency', done => {
			const asyncfns = [asyncfn(50, true), function () {
				return new Promise((resolve, reject) => {
					setTimeout(function () {
						reject(new Error('There was an error'));
					}, 25);
				});
			}];
			Promisie.settle<boolean>(asyncfns, 1)
				.try(result => {
					expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(1);
					expect(result.fulfilled.length).toEqual(1);
					done();
				}, done);
		});
		it('Should handle sync functions', done => {
			const asyncfns = [asyncfn(50, true), function () {
				return new Promise((resolve, reject) => {
					setTimeout(function () {
						reject(new Error('There was an error'));
					}, 25);
				});
			}, () => true];
			Promisie.settle(asyncfns)
				.try(result => {
					expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(1);
					expect(result.fulfilled.length).toEqual(2);
					done();
				}, done);
		});
		it('Should handle non-function values', done => {
			const asyncfns = [asyncfn(50, true), function () {
				return new Promise((resolve, reject) => {
					setTimeout(function () {
						reject(new Error('There was an error'));
					}, 25);
				});
			}, true];
			Promisie.settle(asyncfns)
				.try(result => {
					expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(1);
					expect(result.fulfilled.length).toEqual(2);
					done();
				}, done);
		});
		it('Should handle an error in execution of sync function', done => {
			let asyncfns = [asyncfn(50, true), () => { throw new Error('TEST'); }];
			Promisie.settle(asyncfns)
				.then((result) => {
          expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(1);
					expect(result.fulfilled.length).toEqual(1);
					done();
        })
        .catch(done);
		});
		it('Should be a chainable method', done => {
      let i = 0;
      (() => {
        return new Promisie((resolve, reject) => {
          resolve([1, 2, 3, 4, 5]);
        });
      })()
				.settle(function () {
					if (++i % 2 === 0) return asyncfn(2, true);
					else return Promisie.reject(new Error('TEST'));
				})
				.try(result => {
					expect(Array.isArray(result.fulfilled)).toBeTruthy;
					expect(Array.isArray(result.rejected)).toBeTruthy;
					expect(result.rejected.length).toEqual(3);
					expect(result.fulfilled.length).toEqual(2);
					done();
				})
				.catch(done);
		});
  });
  
  describe('.doWhilst static method testing', function () {
		it('Should run an async function until evaluation passes', done => {
			let index = 0;
			const results = [];
			const someasync = function () {
				return new Promisie(resolve => {
					setTimeout(() => {
						results.push(index);
						resolve(index++);
					}, 250);
				});
			};
			const evaluation = (val) => val !== 5;
			Promisie.doWhilst(someasync, evaluation)
				.try(() => {
					expect(results).toStrictEqual([0, 1, 2, 3, 4, 5]);
					done();
				})
				.catch(done);
		});
		it('Should be able to handle sync functions', done => {
			let index = 0;
			const results = [];
			const someasync = function () {
				if (index === 3) {
					results.push(index++);
					return index;
				}
				else {
					return new Promisie(resolve => {
						setTimeout(() => {
							results.push(index);
							resolve(index++);
						}, 250);
					});
				}
			};
			const evaluation = (val) => val !== 5;
			Promisie.doWhilst(someasync, evaluation)
				.try(() => {
					expect(results).toStrictEqual([0, 1, 2, 3, 4, 5]);
					done();
				})
				.catch(done);
		});
		it('Should handle an error', done => {
			let index = 0;
			const results = [];
			const someasync = function () {
				return new Promisie((resolve, reject) => {
					setTimeout(() => {
						results.push(index);
						if (index === 3) reject(new Error('Test Error'));
						else resolve(index++);
					}, 250);
				});
			};
			const evaluation = (val) => val !== 5;
			Promisie.doWhilst(someasync, evaluation)
				.then(() => {
					done(new Error('Should not resolve'))
				}, e => {
					expect(e instanceof Error).toBeTruthy;
					done();
				});
		});
  });
  
  describe('.iterate static method testing', function () {
		it('Should iterate through generator and resolve with final value', done => {
			const generator = function* (i) {
				while (i < 5) yield i++;
				return i;
			};
			Promisie.iterate<number>(generator, 0)
				.try(result => {
					expect(result).toEqual(5);
					done();
				})
				.catch(done);
		});
  });
  
  describe('.finally method testing', function () {
		it('Should execute on reject in previous case', done => {
			const startTime = moment();
			asyncfn(25, true)()
				.then(() => asyncfn(25, true)())
				.then(() => Promisie.reject(new Error('TEST')))
				.then(() => asyncfn(25, true)())
				.finally(() => {
					expect(moment().diff(startTime) < 70).toBeTruthy;
					done();
				});
		});
		it('Should reject with an error if argument is not a function', done => {
			asyncfn(25, true)()
				.then(() => asyncfn(15, true)())
				.then(() => Promisie.reject(new Error('TEST')))
				.then(() => asyncfn(15, true)())
				.finally(null)
				.catch(e => {
					expect(e instanceof Error).toBeTruthy;
					done();
				});
		});
  });
  
  describe('.retry method testing', function () {
		it('Should retry until it resolves or hits retry limit', done => {
			let index = 0;
			const retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.retry<string>(retryfn)
				.try(val => {
					expect(val === 'hello world').toBeTruthy;
					done();
				})
				.catch(done);
		});
		it('Should retry until it resolves or hits retry limit and respect timeout', done => {
			let index = 0;
			const retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			const start = new Date();
			Promisie.retry(retryfn, { times: 3, timeout: 75 })
				.try(val => {
					let end = new Date();
					expect(end.getTime() - start.getTime()).toBeGreaterThan(150);
					expect(val === 'hello world').toBeTruthy;
					done();
				})
				.catch(done);
		});
		it('Should retry until it rejects at retry limit', done => {
			let index = 0;
			const retryfn = function () {
				if (5 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.retry(retryfn, { times: 2, timeout: 20 })
				.then(() => {
					done(new Error('Should not resolve'));
				}, e => {
					expect(e.message).toEqual('Test Error');
					done();
				});
		});
		it('Should handle sync functions', done => {
			let index = 0;
			const retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return 'hello world';
			};
			Promisie.retry<string>(retryfn)
				.try(val => {
					expect(val === 'hello world').toBeTruthy;
					done();
				})
				.catch(done);
		});
		it('Should be a chainable method', done => {
			let index = 0;
			const retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.sleep(10)
				.retry<string>(retryfn)
				.try(val => {
					expect(val === 'hello world').toBeTruthy;
					done();
				})
				.catch(done);
		});
		it('Should retry until it rejects at retry limit as a chainable', done => {
			let index = 0;
			const retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.sleep(10)
				.retry(retryfn, { times: 2, timeout: 200 })
				.then(() => {
					done(new Error('Should not resolve'));
				}, e => {
					expect(e.message).toEqual('Test Error');
					done();
				});
		});
	});
});