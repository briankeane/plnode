'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RotationItemSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('RotationItem', RotationItemSchema);