'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PresetSchema = new Schema({
  follower:    { type: Schema.ObjectId, ref: 'User' },
  followee:    { type: Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Preset', PresetSchema);