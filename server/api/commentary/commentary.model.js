'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var AudioBlockSchema = require('../audioBlock/audioBlock.schema');
var Station = require('../station/station.model');
var timestamps = require('mongoose-timestamp');

var commentarySchema = AudioBlockSchema.extend({
  _station:           { type: Schema.ObjectId, ref: 'Station' },
  title:              { type: String, default: 'Commentary' } 
});

var Commentary = mongoose.model('Commentary', commentarySchema);
module.exports = Commentary;