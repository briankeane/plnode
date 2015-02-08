'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SpinSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Spin', SpinSchema);