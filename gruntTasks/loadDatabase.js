console.log(process.cwd() + '/server/api/user');
var config = require('../server/config/environment');
var User = require('../server/api/user/user.model');
var Song = require('../server/api/song/song.model');
var Storage = require('../server/utilities/audioFileStorageHandler/audioFileStorageHandler');
var SongPool = require('../server/utilities/songPoolHandlerEmitter/songPoolHandlerEmitter');
var Helper = require('../server/utilities/helpers/helper');
var _ = require('lodash');
var mongoose = require('mongoose');

module.exports = function(grunt) {
  grunt.registerTask('loadDatabase', function() {
    var done = this.async();
    var messedUpSongs = [];

    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);
    
    Song.remove({}, function (err) {

      console.log('getting stored songs...');
      Storage.getAllSongs(function (err, songObjects) {
        if (err) { console.log(err); }
        
        if (!songObjects.length) {
          console.log('no songs found in storage');
          done();
          return;
        }
        for(var i=songObjects.length-1;i>=0;i--) {
          if (isNaN(songObjects[i].duration) || 
            (!songObjects[i].title || (songObjects[i].title == 'undefined') || !songObjects[i].title.trim().length) ||
              (!songObjects[i].artist || (songObjects[i].artist == 'undefined')|| !songObjects[i].artist.trim().length)) {
            messedUpSongs.push(songObjects.splice(i,1));
          }
        }
        console.log('' + songObjects.length + ' songs found');
        var songs = _.map(songObjects, function (attrs) { 
          var newSong = new Song(attrs);
          newSong.save();
          return newSong;
        });
        console.log(songs[0]);

        console.log("stored songs: " + songs.length);
        console.log('song1: ');
        console.log(songs[0]);
        console.log('songObject1: ');
        console.log(songObjects[0]);
        done();
      });
    });
  });
  
  grunt.registerTask('loadEchonestFromDB', function() {
    var done = this.async();
    
    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);

    Song.all(function (err, songs) {
      console.log(songs.length);
      console.log(songs[827])
      var songArrays = [];
      
      // break it up into chunks of 300
      while(songs.length) {
        songArrays.push(songs.splice(0,300));
      }
      songArrays.forEach(function (array) {
        console.log(array[0]);
      });

      SongPool.clearAllSongs()
      .on('finish', function (err) {
        if (err) { console.log(err); }

        var totalChunks = songArrays.length;
        var totalChunksReturned = 0;

        function addChunk() {
          SongPool.addSongs(songArrays[totalChunksReturned])
          .on('finish', function (err) {
            if (err) { 
              console.log(err);
              done();
            }
            totalChunksReturned++;
            console.log('chunk ' + totalChunksReturned + ' returned');
            SongPool.getAllSongs()
            .on('finish', function(err, allSongs) {
              console.log('count: ' + allSongs.length);
              if (err) { console.log(err); }
              if (totalChunksReturned == totalChunks) {
                done();
              } else {
                addChunk();
              }
            });
          });
        }
        addChunk();
      });
    });
  });
}