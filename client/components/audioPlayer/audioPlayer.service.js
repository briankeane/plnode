'use strict';

angular.module('pl2NodeYoApp')
  .service('AudioPlayer', function ($rootScope, $interval, $timeout, Auth) {

    // initialize variables
    var self = this;
    self.muted = false;
    self.volumeLevel = 1;
    self.musicStarted = false;
    self.audioQueue = [];
    self.advanceSpinTimeout;
    self.nowPlaying;
    self.playlist;
    self.requests = [];
    self.volume = 1;

    // set up audio context and audio nodes
    if (!self.context) {
      if ('webkitAudioContext' in window) {
        self.context = new webkitAudioContext;
      } else {
        self.context = new AudioContext();
      }
    }

    // connect context/gain/destination into chain
    self.gainNode = this.context.createGain();
    self.gainNode.connect(this.context.destination);

    // *************************************************
    // *         loadStation(stationId)                *
    // *************************************************
    // * takes an attrs object with listenStationId,   *
    // *   & audioQueue.  Clears out the old info and  *
    // *   loads the new info                          *
    // ************************************************* 
    this.loadStation = function (stationId) {
      self.clearPlayer();

      self.stationId = stationId;

      Auth.getProgram({  id: stationId }, function (err, program) {
        if (err) console.log(err);

        self.nowPlaying = program.nowPlaying;
        self.playlist = [program.playlist[0]];

        loadAudio([self.nowPlaying], function (err) {
          if (err) console.log(err);

          // if it took to long to load the first song, start load process over
          if (Date.now() < self.nowPlaying.endTime) {
            self.loadStation(stationId);
            return;
          }

          // start music, load next songs.
          var msAlreadyElapsed = (Date.now() - new Date(self.nowPlaying.airtime).getTime())/1000;
          self.nowPlaying.source.start(0, msAlreadyElapsed);
          loadAudio(self.playlist, function (err) {
            // set next advance
            self.advanceSpinTimeout = $timeout(function () {
              advanceSpin();
            }, new Date(self.playlist[0].airtime) - Date.now());
          });
        });
      });
    };

    this.setVolume = function (volume) {
      self.volume = volume;
      if (!self.muted) {
        self.gainNode.gain.value = self.volume;
      }
    }
    
    this.clearPlayer = function () {
      // stop the source if it's playing
      if (self.nowPlaying && self.nowPlaying.source) {
        self.nowPlaying.source.stop();
      }

      // stop the next advance
      if (self.advanceSpinTimeout) self.advanceSpinTimeout.cancel();
      
      // clear the queues
      self.nowPlaying = null;
      self.playlist = null;
    };


    function advanceSpin() {
      self.nowPlaying = self.playlist.shift();
      self.nowPlaying.source.start(0);
      // wait and grab the program
      $timeout(function () {
        refreshProgram();
      }, 2000);

      // set up the next advance
      self.advanceSpinTimeout = $timeout(function () {
        advanceSpin();
      }, new Date(self.nowPlaying.endTime).getTime() - Date.now());

    }

    function refreshProgram() {
      Auth.getProgram({  id: self.stationId }, function (err, program) {
        if (err) console.log(err);

        // if the wrong station is now playing, reset it
        if (self.nowPlaying._audioBlock._id != program.nowPlaying._audioBlock._id) {
          self.loadStation(self.stationId);
        
        // otherwise, just append to playlist and load if necessary
        } else {

          // for now, just one song. later it will be duration-based
          self.playlist = [program.playlist[0]];

          loadAudio(self.playlist, function () {
            console.log('audioLoaded');
          });
        }

        //
      });
    }

    // loadAudio only works for 1 element arrays right now
    function loadAudio(spins, callback) {
      var context = self.context;
      

      // load each element
      for (var i=0;i<spins.length;i++) {
        // if it hasn't been done already... 
        if (!spins[i].source) {
          var request = new XMLHttpRequest();
          request.open('GET', spins[i]._audioBlock.audioFileUrl, true);
          request.responseType = 'arraybuffer';

          // decode
          (function (i) {
            request.onload = function () {
              context.decodeAudioData(request.response, function (buffer) {
                var source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(self.gainNode);

                spins[i].source = source;
                callback();
              });
            };
          }(i));
        }

        request.send();

      }
    }
  });

