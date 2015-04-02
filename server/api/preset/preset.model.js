'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var _ = require('lodash');
var timestamps = require('mongoose-timestamp');

var PresetSchema = new Schema({
  _follower:    { type: Schema.ObjectId, ref: 'User' },
  _followee:    { type: Schema.ObjectId, ref: 'User' }
});

PresetSchema.statics.getFollowers = function (userId, callback) {
  Preset
  .find({ _followee: userId })
  .populate('_follower')
  .exec(function (err, presets) {
    if (err) {
      callback(err);
    } else {
      console.log(presets);
      var followers = _.map(presets, function (preset) { return preset._follower });
      console.log('followers after map:');
      console.log(followers);
      var followers = _.sortByAll(followers, ['twitterHandle']);
      callback(null, followers);
    }
  });
} 

PresetSchema.plugin(timestamps);
var Preset = mongoose.model('Preset', PresetSchema);
module.exports = Preset; 