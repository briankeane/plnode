var Song = require('../../api/song/song.model');
var taglib = require('taglib');
var https = require('https');
var qs = require('querystring');
var config = require('../../config/environment');
var echojs = require('echojs');
var natural = require('natural');
var Converter = require('../audioConverter/audioConverter');

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

  this.addSongToSystem = function (attrs, callback) {
    // get tags
    self.getTags(attrs.filepath, function (err, tags) {
      if (err) return err;

    });
  };

  this.getEchonestInfo = function (attrs, callback) {
    echo('song/search').get({ combined: attrs.artist + ' ' + attrs.title
                            }, function (err, json) {
      if (err) callback(err);
      var matches = json.response.songs;
      
      // return null if no songs found
      if (!matches.length) return null;

      var closestMatchIndex = 0;
      var closestMatchRating = 0;

      // find the closest match
      for (var i=0;i<matches.length;i++) {
        matches[i].artistMatchRating = natural.JaroWinklerDistance(matches[i].artist_name.toLowerCase(), attrs.artist.toLowerCase());
        matches[i].titleMatchRating = natural.JaroWinklerDistance(matches[i].title.toLowerCase(), attrs.title.toLowerCase());

        if ((matches[i].artistMatchRating + matches[i].titleMatchRating) > closestMatchRating) {
          closestMatchIndex = i;
          closestMatchRating = matches[i].artistMatchRating + matches[i].titleMatchRating;
        } 
      }

      var closestMatch = matches[closestMatchIndex];

      // rename for consistency
      closestMatch.echonestId = closestMatch.id;
      closestMatch.artist = closestMatch.artist_name;
      closestMatch.genres = [];

      // add genere tags
      echo('artist/profile').get({ name: closestMatch.artist, bucket: 'genre' }, function (err, artistProfile) {

        if (err) {
          callback(null, closestMatch);
        } else {
          // add the genres
          var genres = artistProfile.response.artist.genres;

          for (var i=0;i<genres.length;i++) {
            closestMatch.genres.push(genres[i].name);
          }
        
          callback(null, closestMatch);
        }
      });
    });
  };
}

module.exports = new SongProcessor();