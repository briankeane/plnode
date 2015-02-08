'use strict';


//var User = require('./user');
var timestamps = require('mongoose-timestamp');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var StationSchema = new Schema({
  _user:                                  { type: Schema.ObjectId, ref: 'User'},
  secsOfCommercialPerHour:                { type: Number },
  lastAccuratePlaylistPosition:           { type: Number },
  lastAccurateAirtime:                    { type: Date },
  averageDailyListeners:                  { type: Number },
  timezone:                               { type: String },
  averageDailyListenersCalculationDate:   { type: Date }
});

StationSchema.plugin(timestamps);
var Station = mongoose.model('Station', StationSchema);
module.exports = Station;