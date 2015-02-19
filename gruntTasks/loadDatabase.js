process.env.NODE_ENV || (process.env.NODE_ENV = 'development');
console.log(process.env.NODE_ENV);
console.log(process.cwd() + '/server/api/user');
var config = require('../server/config/environment');
var User = require('../server/api/user/user.model');
var Song = require('../server/api/song/song.model');
var childProcess = require('child_process');
var Storage = require('../server/utilities/audioFileStorageHandler/audioFileStorageHandler');
var SongPool = require('../server/utilities/songPoolHandler/songPoolHandler');
var Helper = require('../server/utilities/helpers/helper');
var _ = require('lodash');
var mongoose = require('mongoose');

module.exports = function(grunt) {
  grunt.registerTask('loadDatabase', function() {
    var done = this.async();

    console.log('environment: ' + process.env.NODE_ENV);
    console.log('key: ' + process.env.ECHONEST_KEY);
    
    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);
    
    console.log('getting stored songs...');
    Storage.getAllSongs(function (err, songObjects) {
      if (err) { console.log(err); }
      
      if (!songObjects.length) {
        console.log('no songs found in storage');
        done();
        return;
      }
      var songs = _.map(songObjects, function (attrs) { return new Song(attrs); });
      console.log("stored songs: " + songs.length);
      console.log('song1: ');
      console.log(songs[0]);
      console.log('songObject1: ');
      console.log(songObjects[0]);
      songs[0].save(function (err, singleSong) {
        console.log('1 saved');

      Helper.saveAll(songs, function (err, savedSongs) {
        if (err) { console.log(err); }
        console.log('Saved Songs: ' + savedSongs.length);
        console.log('Adding Songs to Song Pool');
        SongPool.clearAllSongs(function (err, ticket) {
          if (err) { console.log(err); }
          waitForCompletedTicket(ticket, function() {
            SongPool.addSongs(savedSongs, function (err, savedEchonestTicket) {
              if (err) { console.log(err); }
              waitForCompletedTicket(savedEchonestTicket, function () {
                console.log('All Done.');
                done();
              });
            });
          });
        });
      });
      });
    });
  });

  function waitForCompletedTicket(ticket, callback) {
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





