'use strict';

require('mocha');
let path = require('path'),
	chai = require('chai'),
	expect = chai.expect,
	Promisie = require(path.resolve(__dirname, '../index'));

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
			let test = Promisie.promisifyAll(b);
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
		it('Should handle an error in one of the functions in the series', done => {
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
});
