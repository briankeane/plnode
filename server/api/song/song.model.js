'use strict';

var random = require('mongoose-simple-random');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var AudioBlockSchema = require('../audioBlock/audioBlock.schema');

var songSchema = AudioBlockSchema.extend({
  artist:             { type: String },
  title:              { type: String },
  album:              { type: String },
  echonestId:         { type: String },
  albumArtworkUrl:    { type: String },
  itunesTrackViewUrl: { type: String }
});

// ***********************************************************
// ************************ Statics **************************
// ***********************************************************

songSchema.statics.findAllMatchingTitle = function (title, cb) {
  Song
  .find({ title: new RegExp('^'+title, "i") })
  .sort('title')
  .exec(cb);
}

songSchema.statics.findAllMatchingArtist = function (artist, cb) {
  Song
  .find({ artist: new RegExp('^'+artist, "i") })
  .sort('title')
  .exec(cb);
}

songSchema.statics.keywordSearch = function (keywords, cb) {
  // create an array of regex's
  var keywordsArray = keywords.split(' ');
  var keywordsRegexs = [];
  for (var i=0; i<keywordsArray.length; i++) {
    keywordsRegexs.push(new RegExp(keywordsArray[i], "i"));
  }

  // build the query
  var query = { $and: [] };
  for (var i=0; i<keywordsRegexs.length; i++) {
    query['$and'].push({ $or: [{ title: keywordsRegexs[i] }, { artist: keywordsRegexs[i] }] });
  }

  Song
  .find(query)
  .sort({ artist: 1, title: 1 })
  .limit(20)
  .exec(cb);
}

songSchema.statics.findAllByTitleAndArtist = function (queryObject, cb) {
  Song
  .find(queryObject)
  .sort({ artist: 1, title: 1 })
  .exec(cb);
}

songSchema.statics.all = function (cb) {
  Song
  .find()
  .sort({ artist: 1, title: 1 })
  .exec(cb);
}

// *************************************
songSchema.plugin(random);
var Song = mongoose.model('Song', songSchema);
module.exports = Song;