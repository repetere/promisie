'use strict';
const series_generator = require('./series_generator');
const series_iterator = require('./iterator');
const divide = require('./divisions');
const chainables = require('./chainables');
const parallel_generator = require('./parallel_generator');

module.exports = { series_generator, series_iterator, divide, chainables, parallel_generator };