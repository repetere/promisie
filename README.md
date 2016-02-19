# Promisie
Promisie is an extension of the ES6 native Promise class that provides helpful static methods that are seen in many other Promise libraries
### Version
1.0.4
### Installation
Because Promisie uses native ES6 Promises and classes you must be running Node v4.2.4 or above
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
```
### Testing
```sh
$ npm i promisie
$ cd ./node_modules/promisie
$ npm i
$ npm test
```
### Todos
- Add more prototype and static methods
    - Map
    - Each
    - Filter

License
----

ISC
