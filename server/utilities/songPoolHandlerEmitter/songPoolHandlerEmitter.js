var config = require('../../config/environment');
var echojs = require('echojs');
var _ = require('lodash');
var Song = require('../../api/song/song.model');
var events = require('events');
var Helper = require('../helpers/helper');

function Handler() {
  var self = this;
  var echo = echojs({ key: process.env.ECHONEST_KEY });

  this.addSong = function (song) {
    return this.addSongs([song]);
  };

  this.getAllSongs = function() {
    var emitter = new events.EventEmitter();
    var allSongs = [];

    function getChunkOfSongs(startingIndex) {
      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 300, start: startingIndex }, function (err, json) {

        if (err) { 
          emitter.emit('finish', err, null);
          return;
        }

        var items = json.response["catalog"]["items"];
        for(var i=0;i<items.length;i++) {
          allSongs.push({ artist: items[i]["item_keyvalues"]["pl_artist"],
                          title: items[i]["item_keyvalues"]["pl_title"],
                          album: items[i]["item_keyvalues"]["pl_album"] || null,
                          key: items[i]["item_keyvalues"]["pl_key"],
                          duration: parseInt(items[i]["item_keyvalues"]["pl_duration"]),
                          echonestId: items[i]["song_id"] 
                        });
        }
        if (allSongs.length < json.response["catalog"]["total"]) {
          getChunkOfSongs(startingIndex + 300);
        } else {
          allSongs = _.sortBy(allSongs, function (song) { return [song.artist, song.title] });
          emitter.emit('finish', null, allSongs);
        }
      });
    }

    getChunkOfSongs(0);
    return emitter;
  };

  this.clearAllSongs = function () {
    echo = echojs({ key: process.env.ECHONEST_KEY })
    var emitter = new events.EventEmitter();

    function deleteChunkOfSongs() {

      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {
        // if there's an error, exit with error
        if (err) { 
          emitter.emit('finish', err);
          return;
         }

         // if there are no songs, finish and leave
        if (!json.response["catalog"]["items"].length) { 
          emitter.emit('finish');
          return;
        }

        // map array of strings
        var deleteObjectArray = _.map(json.response["catalog"]["items"], function (item) {
          var deleteItem = '{' +
                              '"action": "delete",' + 
                              '"item": { ' +
                              '"item_id": "' + item["request"]["item_id"] + '"' +
                              '}' + 
                            '}';
          return deleteItem;
        });

        // create string json-array
        var data = '[' + deleteObjectArray.join(', ') + ']';

        echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
          if (err) { emitter.emit('finish', err); }

          waitForCompletedTicket(json.response["ticket"], function () {
            echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, newJson) {
              if (newJson.response["catalog"]["items"].length) {
                deleteChunkOfSongs();
              } else {
                emitter.emit('finish');
              }
            });
          });
        })
      });
    };
    deleteChunkOfSongs();
    return emitter;
  }

  this.addSongs = function (songsToAdd) {
    var emitter = new events.EventEmitter();

    self.getAllSongs()
    .on('finish', function (err, allSongs) {
      if (err) { emitter.emit('finish', err); }

      // remove songs without echonestId
      var count=0;
      var total = songsToAdd.length;
      for(var i=songsToAdd.length-1;i>=0;i--) {
        if (!songsToAdd[i].echonestId) {
          songsToAdd.splice(i,1);
          count++;
        }
      }
      
      // check for duplicates
      var duplicateSongs = allSongs.filter(function (song) {
        var included = false;
        for (var i=0; i<songsToAdd.length; i++) {
          if (song.echonestId === songsToAdd[i].echonestId) {
            return true;
          }
        }
        return false;
      });

      // remove the duplicates from songsToAdd
      for (i=duplicateSongs.length-1;i>=0;i--) {
        for(j=songsToAdd.length-1;j>=0;j--) {
          if (duplicateSongs[i]["song_id"] === songsToAdd.echonestId) {
            songsToAdd.splice(j,1);
          }
        }
      }

      // add the songs
      addSongsJson = _.map(songsToAdd, function (song) {
        return '{ "item": {' +
                    '"item_id": "' + song.key + '", ' +
                    '"song_id" : "' + song.echonestId + '", ' +
                    '"item_keyvalues" : { ' + 
                      '"pl_artist" :"' + Helper.cleanTitleString(song.artist) + '", ' + 
                      '"pl_key" : "' + song.key + '", ' + 
                      '"pl_title" : "' + Helper.cleanTitleString(song.title) + '", ' + 
                      '"pl_album" : "' + Helper.cleanTitleString(song.album || '') + '", ' + 
                      '"pl_duration" : "' + song.duration + '" ' +
                    '}' +
                  '}' +
                '}'
        
      });

      // create a string json array
      var data = "[" + addSongsJson.join(", ") + "]";

      // make the call
      echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
        if (err) { 
          emitter.emit('finish', err); 
          return;
        }
        waitForCompletedTicket(json.response["ticket"], function() {  
          emitter.emit('finish', null);
        });
      });
    });
    
    return emitter;
  }

  this.deleteSong = function (itemId, callback) {
    // build string
    var emitter = new events.EventEmitter();

    data = '[{ "action": "delete", "item": {' + 
                                  '"item_id": "' + itemId + '"' + 
                                  '}' +
            '}]'

     echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
      emitter.emit('finish', err, json);
     });
     return emitter;
  }

  this.getSongSuggestions = function (artists, callback) {
    
    var suggestedSongs = [];

    var getSuggestionFunctions = [];

    // grab 4 songs by each artist if they're there
    for (i=0;i<artists.length;i++) {
      Song.findAllMatchingArtist(artists[i], function (err, matches) {
        for (j=0;(j<=4) && (j<matches.length);j++) {
          suggestedSongs.push(matches[j]);
        }
      });
    }

    // get suggestsions from echonest

    echo('playlist/basic').get({ artist: artists, type: 'artist-radio', results: 100, limit: true,
                                bucket: 'id:' + config.ECHONEST_TASTE_PROFILE_ID } ,function (err, json) {
      var songsJson = json.response["songs"];

      var count = 0;

      for (i=0;(i<songsJson.length) && (i<45);i++) {
        Song.find({ echonestId: songsJson[i]["id"] }, function (err, song) {
          count++;
          if (err) { 
            callback(err, null); 
          } else {
            suggestedSongs.push(song[0]);
            if ((count >= songsJson.length) || (count >= 45)) {
              callback(null, suggestedSongs);
            }
          }
        });
      }
    });
  };


  function waitForCompletedTicket(ticket, callback) {
    if (!ticket) {
      callback();
      return;
    }
    echo('tasteprofile/status').get({ ticket: ticket }, function (err, json) {
      if (json.response["ticket_status"] != 'complete') {
        setTimeout(function () {
          waitForCompletedTicket(ticket, callback);
        }, 1000);
      } else {
        callback();
      }
    });
  }
}

module.exports = new Handler();