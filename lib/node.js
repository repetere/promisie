'use strict';

const CREATE_NODE_FROM_TEMPLATE = function (template) {
  return class NODE {
    constructor (options) {
      for (let key in template) {
        this[key] = template[key].value;
      }
      for (let key in options) {
        this[key] = (!template[key] || (template[key] && template[key].writable)) ? options[key] : template[key].value;
      }
    }
  };
};

module.exports = CREATE_NODE_FROM_TEMPLATE;