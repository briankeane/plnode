'use strict';


var User = require('../user/user.model');
var timestamps = require('mongoose-timestamp');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var StationSchema = new Schema({
  _user:                                  { type: Schema.ObjectId, ref: 'User'},
  secsOfCommercialPerHour:                { type: Number, default: 360 },
  lastAccuratePlaylistPosition:           { type: Number },
  lastAccurateAirtime:                    { type: Date },
  averageDailyListeners:                  { type: Number, default: 0 },
  timezone:                               { type: String },
  averageDailyListenersCalculationDate:   { type: Date, default: new Date() }
});

StationSchema.plugin(timestamps);
var Station = mongoose.model('Station', StationSchema);
module.exports = Station;