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
        console.log('Adding Songs to Song Pool');
        SongPool.clearAllSongs()
        .on('finish', function (err) {
          if (err) { console.log(err); }
          SongPool.addSongs(songs)
          .on('finish', function (err) {
            if (err) { console.log(err); }
            console.log('All Done.');
            console.log('messedUpSongs Count: ' + messedUpSongs.length);
            console.log('messedUpSongs: ');
            messedUpSongs.forEach(function (song) {
              console.log(song.key);  
            })
            done();
          });
        });
      });
    });
  });
  
  grunt.registerTask('loadEchonestFromDB', function() {
    var done = this.async();
    
    // Connect to database
    mongoose.connect(config.mongo.uri, config.mongo.options);

    Song.all(function (err, songs) {
      console.log(songs.length);  
      SongPool.clearAllSongs()
      .on('finish', function (err) {
        if (err) { console.log(err); }
        SongPool.addSongs(songs)
        .on('finish', function (err) {
          if (err) { console.log(err); }
          done();
        });
      });
    });
  });
}