'use strict';

const NODE = class TreeNode {
  constructor (options = {}) {
		this.right = options.right;
		this.left = options.left;
    this.value = options.value;
    this.__isFulfilled = false;
	}	
};

module.exports = NODE;