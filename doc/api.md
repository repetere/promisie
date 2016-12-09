## Classes

<dl>
<dt><a href="#Promisie">Promisie</a> ⇐ <code>Promise</code></dt>
<dd></dd>
<dt><a href="#{Function} Constructor for Promisie class">{Function} Constructor for Promisie class</a></dt>
<dd></dd>
</dl>

<a name="Promisie"></a>

## Promisie ⇐ <code>Promise</code>
**Kind**: global class  
**Extends:** <code>Promise</code>  

* [Promisie](#Promisie) ⇐ <code>Promise</code>
    * [new Promisie()](#new_Promisie_new)
    * [.promisify(fn, [_this])](#Promisie.promisify) ⇒ <code>function</code>
    * [.promisifyAll(mod, [_this], [options])](#Promisie.promisifyAll) ⇒ <code>Object</code>
    * [.series(fns)](#Promisie.series) ⇒ <code>Object</code>
    * [.pipe(fns)](#Promisie.pipe) ⇒ <code>Object</code>
    * [.map(datas, [concurrency], fn)](#Promisie.map) ⇒ <code>Object</code>
    * [.each(datas, [concurrency], fn)](#Promisie.each) ⇒ <code>Object</code>
    * [.parallel(fns, args)](#Promisie.parallel) ⇒ <code>Object</code>
    * [.settle(fns)](#Promisie.settle) ⇒ <code>Object</code>
    * [.compose({Function[)](#Promisie.compose) ⇒ <code>function</code>
    * [.all(argument)](#Promisie.all) ⇒ <code>Object</code>
    * [.iterate(generator, initial)](#Promisie.iterate) ⇒ <code>Object</code>
    * [.doWhilst(fn, evaluate)](#Promisie.doWhilst) ⇒ <code>Object</code>
    * [.retry(fn, [options])](#Promisie.retry) ⇒ <code>Object</code>

<a name="new_Promisie_new"></a>

### new Promisie()
Promisie inherits from the Promise class and adds helpful chainble methods

<a name="Promisie.promisify"></a>

### Promisie.promisify(fn, [_this]) ⇒ <code>function</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>function</code> - Returns a promisifed function which returns a Promise  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Async function that expects a callback |
| [_this] | <code>\*</code> | Optional "this" that will be bound to the promisified function |

<a name="Promisie.promisifyAll"></a>

### Promisie.promisifyAll(mod, [_this], [options]) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns a clone of original object or array with promisified functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mod | <code>Object</code> |  | An object or array containing functions to be promisified non-functions can be included an will be skipped |
| [_this] | <code>\*</code> |  | Optional "this" that will be bound to all promisified functions |
| [options] | <code>Object</code> | <code>{recursive:false,readonly:true}</code> | Options for the execution of promisifyAll |
| options.recursive | <code>boolean</code> |  | If true promisifyAll will recursively promisify functions inside of child objects |
| options.readonly | <code>boolean</code> |  | If true promisifyAll will ensure that property is writable before trying to re-assign |

<a name="Promisie.series"></a>

### Promisie.series(fns) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns an instance of Promisie which resolves after the series finishes execution  

| Param | Type | Description |
| --- | --- | --- |
| fns | <code>Array</code> &#124; <code>Object</code> | An array or iterable object containing functions that will be run in series |

<a name="Promisie.pipe"></a>

### Promisie.pipe(fns) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns an function which will run Promisie.series when called  

| Param | Type | Description |
| --- | --- | --- |
| fns | <code>Array</code> &#124; <code>Object</code> | An array or iterable object containing functions that will be run in series |

<a name="Promisie.map"></a>

### Promisie.map(datas, [concurrency], fn) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns and instance of Promisie which resolves with an array of resolved values  

| Param | Type | Description |
| --- | --- | --- |
| datas | <code>\*</code> | An array of data to be used as first argument in iterator function |
| [concurrency] | <code>number</code> | Optional concurrency limit |
| fn | <code>function</code> | Iterator function for map if concurrency isn't passed it fn can be passed as second argument |

<a name="Promisie.each"></a>

### Promisie.each(datas, [concurrency], fn) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns and instance of Promisie which resolves with original datas argument  

| Param | Type | Description |
| --- | --- | --- |
| datas | <code>\*</code> | An array of data to be used as first argument in iterator function |
| [concurrency] | <code>number</code> | Optional concurrency limit |
| fn | <code>function</code> | Iterator function for each if concurrency isn't passed it fn can be passed as second argument |

<a name="Promisie.parallel"></a>

### Promisie.parallel(fns, args) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns and instance of Promisie which resolves after parallel operations are complete  

| Param | Type | Description |
| --- | --- | --- |
| fns | <code>Object</code> &#124; <code>Array.&lt;function()&gt;</code> | Array of functions or object containing functions. If an object will resolve to an object with matching keys mapped to resolve values |
| args | <code>\*</code> | An array of arguments or a single argument that will be passed to each function being run in parallel |

<a name="Promisie.settle"></a>

### Promisie.settle(fns) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns a Promisie which resolves with an object containing a "fulfilled" and "rejected" property. Almost always resolves rejected promises will be in "rejected" array and resolved will be in "fulfilled" array  

| Param | Type | Description |
| --- | --- | --- |
| fns | <code>Array.&lt;function()&gt;</code> &#124; <code>Object</code> | An array of functions or object containing functions |

<a name="Promisie.compose"></a>

### Promisie.compose({Function[) ⇒ <code>function</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>function</code> - Almost the exact same functionality as Promisie.pipe except fns are reversed before being compiled into pipe  

| Param | Description |
| --- | --- |
| {Function[ | fns An array of functions that will be compiled into pipe |

<a name="Promisie.all"></a>

### Promisie.all(argument) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns and instance of Promise which resolves once all Promises have resolved  

| Param | Type | Description |
| --- | --- | --- |
| argument | <code>Array.&lt;Object&gt;</code> &#124; <code>Object</code> &#124; <code>Object</code> | An array of unresolved Promises, or an argument list comprised of unresolved Promises, or an iterable object containing unresolved Promises |

<a name="Promisie.iterate"></a>

### Promisie.iterate(generator, initial) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns a Promisie which resolves once generator has yielded its last value  

| Param | Type | Description |
| --- | --- | --- |
| generator | <code>function</code> | An uninitialized generator function |
| initial | <code>\*</code> | An initial value to be passed to the generator |

<a name="Promisie.doWhilst"></a>

### Promisie.doWhilst(fn, evaluate) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns a Promisie which resolves once evaluate function return false  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Iterator function that will be called until evalution returns false |
| evaluate | <code>function</code> | An evaluation function that is run after each iteration of fn resolves. If evaluate returns true iterator will be called again |

<a name="Promisie.retry"></a>

### Promisie.retry(fn, [options]) ⇒ <code>Object</code>
**Kind**: static method of <code>[Promisie](#Promisie)</code>  
**Returns**: <code>Object</code> - Returns a Promisie which resolves once function successfully resolves or rejects at retry limit  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fn | <code>function</code> |  | Function that will be called by retry until retry limit is reached or resolves |
| [options] | <code>Object</code> | <code>{times:3,timeout:0}</code> | Configurable options for retry |
| options.times | <code>number</code> |  | Times to retry function before rejecting on error defaults to 3 |
| options.timeout | <code>number</code> |  | Timeout between each retry in ms defaults to 0 |

<a name="{Function} Constructor for Promisie class"></a>

## {Function} Constructor for Promisie class
**Kind**: global class  
<a name="new_{Function} Constructor for Promisie class_new"></a>

### new {Function} Constructor for Promisie class(options)
**Returns**: <code>Object</code> - Returns instance of Promisie  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Passes options to Promise constructor |

