'use strict';

var Promisie;

const NODE = class TreeNode {
  constructor (options = {}) {
		this.right = options.right;
		this.left = options.left;
    this.value = options.value;
    this.__isFulfilled = false;
	}	
};

var _insert = function (values) {
	values.forEach((data, index) => {
    if (index === 0) {
      this.root = (data instanceof Node) ? data : new Node(data);
      this.root.__isFulfilled = true;
    }
		else {
			let current = this.root;
			while (current) {
				if (current.value > data.value) {
					if (!current.left) {
            current.left = (data instanceof Node) ? data : new Node(data);
            current.left.__isFulfilled = true;
						current = null;
					}
					else current = current.left;
				}
				else if (current.value < data.value) {
					if (!current.right) {
            current.right = (data instanceof Node) ? data : new Node(data);
            current.right.__isFulfilled = true;
						current = null;
					}
					else current = current.right;
				}
				else current = null;
			}
		}	
  });
	return this;
};

var _order = function () {
	var isFirst = true;
  return function order (values, result = []) {
    let scoped_order = order.bind(this);
		values = values.sort(this.sort_fn);
		if (values.length === 0) return result;
		else {
			let mid = Math.floor((values.length - 1) / 2) + 1;
			if (isFirst) {
				isFirst = false;
				result.push(values.splice(--mid, 1)[0]);
			}
			let left = values.splice(0, mid), right = values;
      if (left[Math.ceil((left.length - 1) / 2)]) result.push(left.splice(Math.floor((left.length - 1) / 2), 1)[0]);
      if (right[Math.ceil((right.length - 1) / 2)]) result.push(right.splice(Math.floor((right.length - 1) / 2), 1)[0]);
			scoped_order(left, result);
			return scoped_order(right, result);
		}
	};
};

var _timeout = function (argv) {
  return setTimeout(() => {
    clearTimeout(this.__insertTimeout);
    this.__insert = this.__insert.map(data => {
      return Promisie.resolve((data && data.__isFulfilled) ? data : this.task(data))
        .then(result => {
          if (!data.__isFulfilled) data.value = result;
          return data;
        }, e => Promise.reject(e));
    });
    let order = _order().bind(this);
    Promisie.all(this.__insert)
      .try(order)
      .try(_insert.bind(this))
      .then(_this => {
        this.length = this.__insert.length;
        if (typeof argv[argv.length - 1] === 'function') argv[argv.length - 1](null, _this);
      })
      .catch(e => {
        if (typeof argv[argv.length - 1] === 'function') argv[argv.length - 1](e);
      });
  }, this.delay);
};

const BINARY_TREE = class BinaryTree {
  constructor (options = {}) {
		this.__insertTimeout = undefined;
		this.__insert = [];
		this.sort_fn = (typeof options.sort_fn === 'function') ? options.sort_fn : (a, b) => b.value - a.value;	
    this.delay = (typeof options.delay === 'number') ? options.delay : 500;
    this.root = (options.root) ? new Node(options.root) : null;
    this.task = (typeof options.task === 'function') ? options.task : function (node) {
      return node.value;
    };
    this.length = 0;
	}
	insert () {
    let argv = [...arguments];
    this.__insert = this.__insert.concat((typeof argv[argv.length - 1] === 'function') ? argv.slice(0, argv.length - 1) : argv);
		if (!this.__insertTimeout) this.__insertTimeout = _timeout.call(this, argv);
		else {
      clearTimeout(this.__insertTimeout);
      this.__insertTimeout = _timeout.call(this, argv);
		}
  }
  settle () {
    return Promisie.promisify(this.insert, this)();
  }
  remove () {
    let argv = [...arguments];
    let evaluation = (typeof argv[argv.length - 1] === 'function') ? argv.splice(argv.length - 1, 1) : false;
    let removed = [];
    this.__insert = this.__insert.filter(data => {
      let value = (typeof evaluation === 'function') ? evaluation(data.value) : data.value;
      if (argv.indexOf(value) === -1) return true;
      else {
        removed.push(data);
        return false;
      }
    });
    return this.settle()
      .then(() => {
        return removed;
      }, e => Promise.reject(e));
  }
  search (value, evaluation) {
    if (typeof evaluation !== 'function') evaluation = this.sort_fn.bind(this);
    let current = this.root;
    while (current) {
      if (current.value === value) return current;
      else if (evaluation(value, current.value)) current = current.left;
      else current = current.right;
    }
    return null;
  }
};

module.exports = function (promisie) {
  Promisie = promisie;
  return BINARY_TREE;
};

/*
//TODO
- Configurable collision behavior ie. Tree, Queue, Hash, Heap, Graph
- Configurable tree type ie. BinarySearch, Red/Black, Binary
- Error handling
- .depth property should return the number of layers currently in tree
- .idle method should return true if all nodes are fulfilled or false if there are any pending
- .refresh method should re-run task on current values of all nodes and re-order

var tree = new BINARY_TREE({
  task: function (data) {
    return new Promise(resolve => {
      let timeout = setTimeout(function () {
        resolve(data.value * 2);
      }, 1000);
    });
  }
});
tree.insert({ value: 40 }, { value: 60 }, { value: 45 }, { value: 35 }, { value: 50 });
tree.insert({ value: 47 }, { value: 32 }, { value: 55 }, { value: 30 }, { value: 56 });
tree.settle()
  .then(() => {
    tree.insert({ value: 25 }, { value: 65 }, { value: 52 }, { value: 31 }, { value: 33 });
    return tree.settle();
  })
  .then(() => {
    console.log(tree.root);
    console.log(tree.search(120));
  });
*/
