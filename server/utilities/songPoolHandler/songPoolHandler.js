var config = require('../../config/environment');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var _ = require('lodash');

function Handler() {
  var self = this;

  this.addSong = function (song) {
    return this.addSongs([song], callback);
  }

  this.addSongs = function (songsToAdd, callback) {
    self.getAllSongs(function (err, allSongsJson) {
      
      // check for duplicates
      var duplicateSongs = allSongsJson.filter(function (song) { 
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

      var data = "[" + addSongsJson.join(", ") + "]";
      console.log('data: ');
      console.log(data);
      echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
        callback(err, json);
      });

    });
  }

  this.clearAllSongs = function (callback) {

    function deleteChunk() {

      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {
        // if (!json.response["catalog"]["items"].length) {
        //   callback();
        //   return;
        // }

        console.log(json.response["catalog"]["items"]);
        var deleteObjectArray = _.map(json.response["catalog"]["items"], function (item) {
          var deleteItem = '{' +
                              '"action": "delete",' + 
                              '"item": { ' +
                              '"item_id": "' + item["request"]["item_id"] + '"' +
                              '}' + 
                            '}';
          return deleteItem;
        });

        var data = '[' + deleteObjectArray.join(', ') + ']';
        console.log(data);

        echo('tasteprofile/update').post({ id: config.ECHONEST_TASTE_PROFILE_ID, data: data }, function (err, json) {
          callback(); 
          // echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {
          //   if (err) { console.log(err); }
          //   console.log(json.response);
          //   if (!json.response["catalog"]["items"].length) {
          //     callback();
          //   } else {
          //     deleteChunk();
          //   }
          // });
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
        console.log(json.response);
        var items = json.response["catalog"]["items"];
        for (var i=0; i<items.length; i++) {
          allSongs.push({ artist: items[i]["item_keyvalues"]["pl_artist"],
                          title: items[i]["item_keyvalues"]["pl_title"],
                          album: items[i]["item_keyvalues"]["pl_album"] || null,
                          key: items[i]["item_keyvalues"]["pl_key"],
                          echonestId: items[i]["song_id"] 
                        });
        }
        if (allSongs.length < json.response["catalog"]["total"]) {
          grabChunk(startingIndex + 1000);
        } else {
          console.log(allSongs);
          callback(null, allSongs);
        }
      });
    }

    grabChunk(0);
  }
}

module.exports = new Handler();