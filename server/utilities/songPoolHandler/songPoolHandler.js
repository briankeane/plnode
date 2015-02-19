var config = require('../../config/environment');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var EARLY_KEY = process.env.ECHONEST_KEY;
var _ = require('lodash');
var async = require('async');
var Song = require('../../api/song/song.model');

function Handler() {
  var self = this;

  this.addSong = function (song, callback) {
    this.addSongs([song], callback);
  }

  this.addSongs = function (songsToAdd, callback) {
    self.getAllSongs(function (err, allSongs) {
      
      // check for duplicates
      var duplicateSongs = allSongs.filter(function (song) { 
        var included = false;
        for (var i=0; i<songsToAdd.length; i++) {
          if (song.echonestId === songsToAdd.echonestId) {
            return true;
          }
        }
        return false;
      });

      // remove duplicates from songsToAdd
      for (i=duplicateSongs.length-1;i>=0;i--) {
        for(j=songsToAdd.length-1;j>=0;j--) {
          if (duplicateSongs[i]["song_id"] === songsToAdd.echonestId) {
            console.log('removing duplicate: ');
            console.log(songsToAdd[j]);
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
                      '"pl_artist" :"' + song.artist + '", ' + 
                      '"pl_key" : "' + song.key + '", ' + 
                      '"pl_title" : "' + song.title + '", ' + 
                      '"pl_album" : "' + song.album + '", ' + 
                      '"pl_duration" : "' + song.duration + '" ' +
                    '}' +
                  '}' +
                '}'
        
      });

      // create a string json array
      var data = "[" + addSongsJson.join(", ") + "]";
      
      // make the call and pass it the callback
      echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
        callback(err, json.response["ticket"]);
      });

    });
  }
  this.deleteSong = function (itemId, callback) {

    // build string
    data = '[{ "action": "delete", "item": {' + 
                                  '"item_id": "' + itemId + '"' + 
                                  '}' +
            '}]'

     echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
      callback(null, json.response["ticket"]);
     });
  }

  this.clearAllSongs = function (callback) {
    var echo = echojs({ key: process.env.ECHONEST_KEY });
    function deleteChunk() {

      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {

        if (!json.response["catalog"]["items"].length) {
          callback(null, null);
          return;
        }

        console.log("profile_id: "+ config.ECHONEST_TASTE_PROFILE_ID);
        console.log("key: " + process.env.ECHONEST_KEY);
        console.log("early key " + EARLY_KEY);

        if (err) { console.log(err); }
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
          waitForCompletedTicket(json.response["ticket"], function () {
            echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, newJson) {
              if (newJson.response["catalog"]["items"].length) {
                deleteChunk();
              } else {
                callback(null, newJson.response["ticket"]);
              }
            }); 
          });
        });
      });
    }

    deleteChunk();
  };

  this.grabJson = function (callback) {
    echo('tasteprofile/read').get({ id: "CALBLSS14721C1C716", results: 5 }, function (err, json) {
      callback(err, json);
    });
  }

  this.getAllSongs = function (callback) {
    var allSongs = [];

    function grabChunk(startingIndex) {
      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000, start: startingIndex }, function (err, json) {
        var items = json.response["catalog"]["items"];
        for (var i=0; i<items.length; i++) {
          allSongs.push({ artist: items[i]["item_keyvalues"]["pl_artist"],
                          title: items[i]["item_keyvalues"]["pl_title"],
                          album: items[i]["item_keyvalues"]["pl_album"] || null,
                          key: items[i]["item_keyvalues"]["pl_key"],
                          duration: parseInt(items[i]["item_keyvalues"]["pl_duration"]),
                          echonestId: items[i]["song_id"] 
                        });
        }
        if (allSongs.length < json.response["catalog"]["total"]) {
          grabChunk(startingIndex + 1000);
        } else {
          allSongs = _.sortBy(allSongs, function(song) { return [song.artist, song.title]; });
          callback(null, allSongs);
        }
      });
    }


    grabChunk(0);
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
            console.log(err); 
          } else {
            suggestedSongs.push(song[0]);
            if ((count >= songsJson.length) || (count >= 45)) {
              callback(null, suggestedSongs);
            }
          }
        });
      }
    });
  }

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