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
      var followers = _.map(presets, function (preset) { return preset._follower });

      followers = _.sortByAll(followers, ['twitterHandle']);
      callback(null, followers);
    }
  });
}

PresetSchema.statics.getPresets = function (userId, callback) {
  Preset
  .find({ _follower: userId })
  .populate('_followee')
  .exec(function (err, presets) {
    if (err) {
      callback(err);
    } else {
      var followees = _.map(presets, function (preset) { return preset._followee });
      followees = _.sortByAll(followees, ['twitterHandle'])
      callback(null, followees);
    }
  });
}

PresetSchema.plugin(timestamps);
var Preset = mongoose.model('Preset', PresetSchema);
module.exports = Preset; 