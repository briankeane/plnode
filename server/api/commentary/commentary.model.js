'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CommentarySchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Commentary', CommentarySchema);