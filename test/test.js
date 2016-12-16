'use strict';

require('mocha');
var path = require('path'),
	chai = require('chai'),
	fs = require('fs'),
	expect = chai.expect,
	Promisie = require(path.resolve(__dirname, '../index'));

var asyncfn = function (time, val) {
	return function () {
		return new Promisie(resolve => {
			let timeout = setTimeout(function () {
				resolve(val);
			}, time);
		});
	};
};

describe('Promisie test', function () {
	describe('Basic assertions', function () {
		it('Should be a constructor function', function () {
			expect(typeof Promisie === 'function').to.be.true;
		});
		it('Should have methods promisify and promisifyAll', function () {
			expect(Promisie.promisify).to.be.a('function');
			expect(Promisie.promisifyAll).to.be.a('function');
		});
		it('Should return an instance of a promise if called with "new" keyword', function () {
			let a = new Promisie(function () { });
			expect(a instanceof Promise).to.be.true;
		});
		it('Should be chainable if a new Promisie is returned', function () {
			let a = function () {
				return new Promise(function (resolve, reject) {
					resolve();
				});
			};
			expect(a().then).to.be.a('function');
		});
	});
	describe('Basic static method tests', function () {
		describe('promisify functionality', function () {
			it('Should return a function when called with a function', function () {
				let a = function () {
					return;
				};
				expect(Promisie.promisify(a)).to.be.a('function');
			});
			it('Should throw an error when called with a non-function', function () {
				try {
					let a = Promisie.promisify();
				}
				catch (e) {
					expect(e instanceof Error).to.be.true;
				}
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
				expect(fns.bAsync).to.be.a('function');
				expect(fns.cAsync).to.be.a('function');
			});
			it('Should throw an error when called with a non-object', function () {
				try {
					let a = Promisie.promisifyAll();
				}
				catch (e) {
					expect(e instanceof Error).to.be.true;
				}
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
			}, 2000);
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
					}, 2000);
				},
				d: function (str, cb) {
					setTimeout(function () {
						if (str instanceof Error) {
							cb(str);
						}
						else {
							cb(null, str);
						}
					}, 4000);
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
						}, 4000);
					}
				}
			},
			testConstructor = function (str) {
				this.msg = str;
				this.log = function (cb) {
					setTimeout(() => {
						cb(null, this.msg);
					}, 2000);
				};
			},
			f = new testConstructor('hello');
		describe('promisify functionality', function () {
			this.timeout(7000);
			let test = Promisie.promisify(a);
			it('Should return a function that returns and instance of a Promise', function () {
				expect(test('') instanceof Promise).to.be.true;
			});
			it('Should be chainable and resolve the promisified function', function (done) {
				test('hello')
					.then(msg => {
						expect(msg).to.equal('hello');
						done();
					});
			});
			it('Should fall into catch block if promisified function is rejected', function (done) {
				test(new Error('Test Error'))
					.then(msg => { })
					.catch(e => {
						expect(e instanceof Error).to.be.true;
						done();
					});
			});
			it('Should be able to promisify prototype metods if "this" is passed as second argument', function (done) {
				this.timeout(3000);
				let test = Promisie.promisify(f.log, f);
				test().then(msg => {
					expect(msg).to.equal('hello');
					done();
				});
			});
		});
		describe('promisifyAll functionality', function () {
			this.timeout(20000);
			let test = Promisie.promisifyAll(b, undefined, { recursive: true, readonly: false });
			it('Should return Async methods that are instances of Promises', function () {
				expect(test.cAsync('') instanceof Promise).to.be.true;
				expect(test.dAsync('') instanceof Promise).to.be.true;
				expect(test.eAsnyc).to.equal(undefined);
				expect(test.f).to.be.an('object');
				expect(test.f.gAsync('') instanceof Promise).to.be.true;
			});
			it('Async methods should be chainable', function (done) {
				test.cAsync('hello')
					.then(msg => {
						expect(msg).to.equal('hello');
						return test.dAsync('world');
					})
					.then(msg => {
						expect(msg).to.equal('world');
						done();
					});
			});
			it('Should fall into catch block if promisified function is rejected', function (done) {
				test.cAsync(new Error('Test Error'))
					.then(msg => { })
					.catch(e => {
						expect(e instanceof Error).to.be.true;
						done();
					});
			});
			it('Should be able to promisifyAll on core node modules', function (done) {
				try {
					let fsAsync = Promisie.promisifyAll(fs, undefined, { recursive: false, readonly: true });
					expect(fsAsync).to.be.an('object');
					expect(fsAsync.readFileAsync).to.be.a('function');
					done();
				}
				catch (e) {
					done(e);
				}
			});
		});
	});
	describe('Static method series testing', function () {
		this.timeout(15000);
		it('Should be able to run a series of async functions', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			Promisie.series(asyncfns)
				.then(result => {
					expect(result).to.equal(15);
					done();
				}, done);
		});
		it('Should be able to run a series containing sync functions', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			asyncfns[2] = (val) => 3 + val;
			Promisie.series(...asyncfns)
				.then(result => {
					expect(result).to.equal(15);
					done();
				}, done);
		});
		it('Should reject with an error if series contains any non-functions', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			asyncfns[2] = false;
			Promisie.series(asyncfns)
				.then(() => {
					done(new Error('Should have rejected with an error'));
				}, e => {
					expect(e instanceof Error).to.be.true;
					done();
				});
		});
		it('Should handle an error in one of the functions in the series if all functions are async', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							if (i === 3) reject(i);
							else resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			Promisie.series(asyncfns)
				.then(() => {
					done(new Error('Should have rejected with an error'));
				}, e => {
					expect(e).to.equal(3);
					done();
				});
		});
		it('Should handle an error in one of the functions in the series if all functions are sync', done => {
			let syncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					if (i === 3) throw i;
					else return i + (val || 0);
				};
			});
			Promisie.series(syncfns)
				.then(() => {
					done(new Error('Should have rejected with an error'));
				}, e => {
					expect(e).to.equal(3);
					done();
				});
		});
	});
	describe('.try method testing', function () {
		this.timeout(10000);
		it('Should be chainable', done => {
			(function () {
				return new Promisie((resolve) => {
					setTimeout(function () {
						resolve();
					}, 2500);
				});
			})()
				.then(() => {
					return new Promisie((resolve) => {
						setTimeout(function () {
							resolve();
						}, 1000);
					});
				})
				.try(() => {
					return new Promisie((resolve) => {
						setTimeout(function () {
							resolve('hello');
						}, 1000);
					});
				})
				.then(data => {
					expect(data).to.equal('hello');
					done();
				})
				.catch(done);
		});
		it('Should handle an error', done => {
			(function () {
				return new Promisie((resolve) => {
					setTimeout(function () {
						resolve();
					}, 2500);
				});
			})()
				.try(() => {
					throw new Error('test error');
				})
				.then(() => {
					done(new Error('Should not get here'));
				})
				.catch(e => {
					expect(e instanceof Error).to.be.true;
					expect(e.message).to.equal('test error');
					done();
				});
		});
	});
	describe('Static method pipe and compose testing', function () {
		this.timeout(15000);
		it('Pipe should return a function that will pass arguments to the first function in a series', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			let pipe = Promisie.pipe(asyncfns);
			pipe(5)
				.try(result => {
					expect(result).to.equal(20);
					done();
				})
				.catch(done);
		});
		it('Compose should reverse and return a function that will pass arguments to the first function in a series', done => {
			let asyncfns = [1, 2, 3, 4, 5].map(i => {
				return function (val) {
					return new Promise((resolve, reject) => {
						setTimeout(function () {
							resolve(i + (val || 0));
						}, i * 250);
					});
				};
			});
			let compose = Promisie.compose(asyncfns);
			compose(5)
				.try(result => {
					expect(result).to.equal(20);
					done();
				})
				.catch(done);
		});
	});
	describe('.map method testing', function () {
		this.timeout(15000);
		let arr = [1, 2, 3, 4, 5];
		it('Should resolve with fully resolved array if concurrency isn\'t passed', done => {
			Promisie.map(arr, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val);
						clearTimeout(timeout);
					}, 250);
				});
			})
				.try(resolved => {
					expect(resolved).to.deep.equal(arr);
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
					}, 1000);
				});
			})
				.then(val => {
					done(new Error('Should not get here'));
				}, e => {
					expect(e).to.equal(1);
					done();
				});
		});
		it('Should resolve after running operations with a concurrency limit', done => {
			Promisie.map(arr, 2, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val);
						clearTimeout(timeout);
					}, 1000);
				});
			})
				.try(resolved => {
					expect(resolved).to.deep.equal(arr);
					done();
				})
				.catch(done);
		});
		it('Should also be a chainable method', done => {
			let mapfn = asyncfn(250, [1, 2, 3]);
			mapfn()
				.map(function (data) {
					return asyncfn(250, data + 1)();
				})
				.then(result => {
					expect(result).to.deep.equal([2, 3, 4]);
					done();
				}, done);
		});
	});
	describe('.each method testing', function () {
		this.timeout(15000);
		let arr = [1, 2, 3, 4, 5];
		it('Should resolve with fully resolved array if concurrency isn\'t passed', done => {
			Promisie.each(arr, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val + 1);
						clearTimeout(timeout);
					}, 250);
				});
			})
				.try(resolved => {
					expect(resolved).to.deep.equal(arr);
					done();
				})
				.catch(done);
		});
		it('Should handle rejection when concurrency isn\'t passed', done => {
			Promisie.each(arr, val => {
				return new Promise((resolve, reject) => {
					let timeout = setTimeout(() => {
						reject(val);
						clearTimeout(timeout);
					}, 1000);
				});
			})
				.then(val => {
					done(new Error('Should not get here'));
				}, e => {
					expect(e).to.equal(1);
					done();
				});
		});
		it('Should resolve after running operations with a concurrency limit', done => {
			Promisie.each(arr, 2, val => {
				return new Promise(resolve => {
					let timeout = setTimeout(() => {
						resolve(val + 1);
						clearTimeout(timeout);
					}, 1000);
				});
			})
				.try(resolved => {
					expect(resolved).to.deep.equal(arr);
					done();
				})
				.catch(done);
		});
		it('Should also be a chainable method', done => {
			let eachfn = asyncfn(250, [1, 2, 3]);
			eachfn()
				.each(function (data) {
					return asyncfn(250, data + 1)();
				})
				.then(result => {
					expect(result).to.deep.equal([1, 2, 3]);
					done();
				}, done);
		});
	});
	describe('.spread method testing', function () {
		it('Should spread any iterable value so the next function is called with the array values as arguments', done => {
			let arr_resolver = asyncfn(250, [1, 2, 3]);
			arr_resolver()
				.spread(function () {
					let argv = [...arguments];
					expect(Array.isArray(arguments)).to.be.false;
					expect(argv).to.deep.equal([1, 2, 3]);
					done();
				})
				.catch(done);
		});
		it('Should be chainable', done => {
			let arr_resolver = asyncfn(250, [1, 2, 3]);
			arr_resolver()
				.spread(function () {
					let argv = [...arguments];
					return argv;
				})
				.then(result => result)
				.spread(function (one, two, three) {
					expect([one, two, three]).to.deep.equal([1, 2, 3]);
					done();
				})
				.catch(done);
		});
	});
	describe('.all static method testing', function () {
		let arrfns = [asyncfn(250, 1), asyncfn(250, 2)];
		it('Should handle a normal iterable', done => {
			Promisie.all(arrfns.map(fn => fn()))
				.then(result => {
					expect(result).to.deep.equal([1, 2]);
					done();
				}, done);
		});
		it('Should handle an argument list', done => {
			Promisie.all(arrfns[0](), arrfns[1]())
				.then(result => {
					expect(result).to.deep.equal([1, 2]);
					done();
				}, done);
		});
	});
	describe('.parallel static method testing', function () {
		it('Should resolve an object in parallel', done => {
			let operations = {
				'hello': asyncfn(250, 'world'),
				'foo': asyncfn(500, 'bar')
			};
			Promisie.parallel(operations)
				.try(result => {
					expect(result).to.deep.equal({ hello: 'world', 'foo': 'bar' });
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
					expect(e instanceof Error).to.be.true;
					done();
				});
		});
	});
	describe('.settle method testing', function () {
		it('Should always resolve and show rejected/resolved promises', done => {
			let asyncfns = [asyncfn(500, true), function () {
				return new Promise((resolve, reject) => {
					setTimeout(function () {
						reject(new Error('There was an error'));
					}, 250);
				});
			}];
			Promisie.settle(asyncfns)
				.try(result => {
					expect(result.fulfilled).to.be.an('array');
					expect(result.rejected).to.be.an('array');
					expect(result.rejected.length).to.equal(1);
					expect(result.fulfilled.length).to.equal(1);
					done();
				}, done);
		});
		it('Should handle an error in execution of sync function', done => {
			let asyncfns = [asyncfn(500, true), () => { throw new Error('TEST'); }];
			Promisie.settle(asyncfns)
				.then(val => {
					done(new Error('Should not resolve'));
				}, e => {
					expect(e instanceof Error).to.be.true;
					done();
				});
		});
	});
	describe('.doWhilst static method testing', function () {
		it('Should run an async function until evaluation passes', done => {
			let index = 0;
			let results = [];
			let someasync = function () {
				return new Promisie(resolve => {
					setTimeout(() => {
						results.push(index);
						resolve(index++);
					}, 250);
				});
			};
			let evaluation = (val) => val !== 5;
			Promisie.doWhilst(someasync, evaluation)
				.try(() => {
					expect(results).to.deep.equal([0, 1, 2, 3, 4, 5]);
					done();
				})
				.catch(done);
		});
		it('Should handle an error', done => {
			let index = 0;
			let results = [];
			let someasync = function () {
				return new Promisie((resolve, reject) => {
					setTimeout(() => {
						results.push(index);
						if (index === 3) reject(new Error('Test Error'));
						else resolve(index++);
					}, 250);
				});
			};
			let evaluation = (val) => val !== 5;
			Promisie.doWhilst(someasync, evaluation)
				.then(() => {
					done(new Error('Should not resolve'))
				}, e => {
					expect(e instanceof Error).to.be.true;
					done();
				});
		});
	});
	describe('.iterate static method testing', function () {
		it('Should iterate through generator and resolve with final value', done => {
			let generator = function* (i) {
				while (i < 5) yield i++;
				return i;
			};
			Promisie.iterate(generator, 0)
				.try(result => {
					expect(result).to.equal(5);
					done();
				})
				.catch(done);
		});
	});
	describe('.retry method testing', function () {
		it('Should retry until it resolves or hits retry limit', done => {
			let index = 0;
			let retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.retry(retryfn)
				.try(val => {
					expect(val === 'hello world').to.be.true;
					done();
				})
				.catch(done);
		});
		it('Should retry until it resolves or hits retry limit and respect timeout', done => {
			let index = 0;
			let retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			let start = new Date();
			Promisie.retry(retryfn, { times: 3, timeout: 750 })
				.try(val => {
					let end = new Date();
					expect(end.getTime() - start.getTime()).to.be.above(1500);
					expect(val === 'hello world').to.be.true;
					done();
				})
				.catch(done);
		});
		it('Should retry until it rejects at retry limit', done => {
			let index = 0;
			let retryfn = function () {
				if (2 > index++) return Promise.reject(new Error('Test Error'));
				return Promise.resolve('hello world');
			};
			Promisie.retry(retryfn, { times: 2, timeout: 200 })
				.then(() => {
					done(new Error('Should not resolve'));
				}, e => {
					expect(e.message).to.equal('Test Error');
					done();
				});
		});
	});
});
