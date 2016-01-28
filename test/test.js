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
			let a = new Promisie(function () {});
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
			}, 5000);
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
					}, 7500);
				},
				d: function (str, cb) {
					setTimeout(function () {
						if (str instanceof Error) {
							cb(str);
						}
						else {
							cb(null, str);
						}
					}, 10000);
				},
				e: 'e'
			};
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
					.then(msg => {})
					.catch(e => {
						expect(e instanceof Error).to.be.true;
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
					.then(msg => {})
					.catch(e => {
						expect(e instanceof Error).to.be.true;
						done();
					});
			});
		});
	});
});
