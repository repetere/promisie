'use strict';
const series_generator = require('./generator');
const series_iterator = require('./iterator');

module.exports = function (promisie) {
  return { series_generator, series_iterator: series_iterator(promisie) };
};