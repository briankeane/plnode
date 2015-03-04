var Song = require('../../api/song/song.model');
var taglib = require('taglib');
var https = require('https');
var qs = require('querystring');
var config = require('../../config/environment');
var echojs = require('echojs');

function SongProcessor() {
  var self = this;
  var echo = echojs({ key: process.env.ECHONEST_KEY });

  this.getTags = function (filepath, callback) {
    taglib.read(filepath, function (err, tag, audioProperties) {
      if (err) callback(err);
      
      // combine objects
      tag.duration = audioProperties.length * 1000;
      tag.bitrate = audioProperties.bitrate;
      tag.sampleRate = audioProperties.sampleRate;
      tag.channels = audioProperties.channels;

      callback(null, tag);

    });
  };

  this.getItunesInfo = function (attrs, callback) {
    var httpCallback = function (response) {
      var string = '';

      response.on('data', function (chunk) {
        string += chunk;
      });

      response.on('end', function () {

        var responseObj = JSON.parse(string)
        if (responseObj.resultCount === 0) {
          var err = new Error('iTunes match not found');
          callback(err);
        } else {
          var match = responseObj.results[0];
        }

        // add the 600x600 albumArtwork
        if (match.artworkUrl100) {
          match.albumArtworkUrl = match.artworkUrl100.replace('100x100-75.jpg', '600x600-75.jpg');
        }

        callback(null, match);
      });
    }

    var options = { host: 'itunes.apple.com',
                  path: '/search?' + qs.stringify( { term: ((attrs.artist || '') + ' ' + (attrs.title || '')) })
                     };
    var req = https.get(options, httpCallback);
    req.on('error', function (err) {
      callback(err);
    });
  };

  this.getSongMatchPossibilities = function (attrs, callback) {
    echo('song/search').get({ combined: attrs.artist + ' ' + attrs.title 
                            }, function (err, json) {
      var songsArray = json.response.songs;

      for(var i=0;i<songsArray.length;i++) {
        songsArray[i].artist = songsArray[i].artist_name;
        songsArray[i].echonestId = songsArray[i].id;
      }
      callback(null, songsArray);
    });
  };
}

module.exports = new SongProcessor();