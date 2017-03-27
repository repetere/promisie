# Promisie
[![Build Status](https://travis-ci.org/typesettin/promisie.svg?branch=master)](https://travis-ci.org/typesettin/promisie) [![NPM version](https://badge.fury.io/js/promisie.svg)](http://badge.fury.io/js/promisie) [![Downloads Per Month](https://img.shields.io/npm/dm/promisie.svg?maxAge=2592000)](https://www.npmjs.com/package/promisie) [![npm](https://img.shields.io/npm/dt/promisie.svg?maxAge=2592000)]() [![Join the chat at https://gitter.im/typesettin/promisie](https://badges.gitter.im/typesettin/promisie.svg)](https://gitter.im/typesettin/promisie?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Download Stats](https://nodei.co/npm/promisie.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/promisie)

Promisie is an extension of the ES6 native Promise class that provides helpful static methods that are seen in many other Promise libraries

![Promisie Logo](https://raw.githubusercontent.com/typesettin/promisie/master/doc/promisie.png)

### Version
1.6.0
### Installation
Because Promisie uses native ES6 Promises, classes and spread operators you must be running Node v6.0.0 or above
```sh
$ npm i promisie
```
### Usage
```javascript
/*
Because Promisie is an extension of the Promise class it also acts as a Promise constructor and shares all prototype methods, but adds promisify and promisifyAll static methods
*/
const Promisie = require('promisie'),
    fs = require('fs');
var readFileAsync = Promisie.promisify(fs.readFile);
readFileAsync('/some/file/path').then(fileData => { ... });
var asyncFs = Promisie.promisifyAll(fs);
asyncFs.readFileAsync('/some/file/path').then(fileData => { ... });
/*
Promisie also exposes a "try" method which works just like "then" but conveniently wrapped in a try/catch block
 */
readFileAsync('/some/file/path')
	.try(data => {
		return data.some.fake.property; //Cant't read property ... of undefined
	})
	.catch(e => { ... });
/*
This would normally halt the execution of your async code because of an unhandled error but the "try" method properly rejects with the error
 */
/*
Promisie also has a series static method which runs and array of functions in series passing the result of each function to the next function.
Additionally there are pipe and compose static methods which return a function expecting arguments that will be passed to the first function in the series (compose reverses the order of the functions it is passed)
*/
let array_of_functions = [fn, fn1, fn2, fn3];
Promisie.series(array_of_functions)
    .then(result => {
        //result is the resolved value of the last function in the array
    })
let pipe = Promisie.pipe(array_of_functions);
pipe('some', 'random', 'arguments')
    .then(result => {
        //result is still the resolved value of the last function in the array with the difference being the first function will be passed the arguments of pipe()
    })
/*
Promisie now has many more helpful methods:
- .map
- .each
- .parallel
- .doWhilst
- .iterate
- .settle
- .all
- .retry
See documentation for more details and test for usage
*/
```
### Notes
* Check out [https://github.com/typesettin/promisie](https://github.com/typesettin/promisie) for the full promisie Documentation

### Testing
```sh
$ npm i promisie
$ cd ./node_modules/promisie
$ npm i
$ npm test
```
### For generating documentation
```sh
$ grunt doc
$ jsdoc2md utility/**/*.js index.js > doc/api.md
```
### Todos
- Add more prototype and static methods
    - Filter
    - Reduce
    - Queue

License
----

MIT
