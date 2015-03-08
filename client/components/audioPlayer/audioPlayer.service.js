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
            });
          });
        });
      });
    };
    
    this.clearPlayer = function () {
      console.log('clearPlayer() called');
    }
    function advanceSpin() {
      console.log('advance spin function called');
    }

    function loadAudio(spins, callback) {
      var context = self.context;
      

      // load each element
      for (var i=0;i<spins.length;i++) {
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
        request.send();

      }
    }
  });

