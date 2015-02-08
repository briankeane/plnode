'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LogEntrySchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('LogEntry', LogEntrySchema);