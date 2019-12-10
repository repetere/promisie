'use strict';

module.exports = function (arr, concurrency) {
  let parts = [];
  while (arr.length) {
    let part = arr.splice(0, concurrency);
    parts.push(part);
  }
  return parts;
};