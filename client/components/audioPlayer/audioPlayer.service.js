'use strict';

angular.module('pl2NodeYoApp')
  .service('AudioPlayer', function ($rootScope, $interval, $timeout, Auth) {

    // initialize variables
    var self = this;
    self.currentUser = Auth.getCurrentUser();
    self.muted = false;
    self.volumeLevel = 1;
    self.musicStarted = false;
    self.audioQueue = [];
    self.nowPlaying;
    self.playlist;
    self.requests = [];
    self.volume = 1;
    self.timeouts = [];
    self.loading = true;
    self.initialLoad = true;
    self.stationId;

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

      self.loading = true;

      self.stationId = stationId;

      // if it's the initial load, set up listeningSession reporting
      if (self.initialLoad) {
        self.initialLoad = false;
        createListeningSession();
      }

      Auth.getProgram({  id: stationId }, function (err, program) {
        if (err) console.log(err);

        self.nowPlaying = program.nowPlaying;
        self.playlist = [program.playlist[0]];

        loadAudio([self.nowPlaying], function (err) {
          if (err) console.log(err);

          // if it took to long to load the first song, start load process over
          if (self.nowPlaying.endTime && (Date.now() < self.nowPlaying.endTime)) {
            self.loadStation(stationId);
            return;
          }

          // start music, load next songs.
          var msAlreadyElapsed = (Date.now() - new Date(self.nowPlaying.airtime).getTime())/1000;
          self.nowPlaying.source.start(0, msAlreadyElapsed);

          self.loading = false;

          loadAudio(self.playlist, function (err) {
            // set next advance
            var newTimeout = $timeout(function () {
              advanceSpin();
              return false;
            }, new Date(self.playlist[0].airtime) - Date.now());

            self.timeouts.push(newTimeout);
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

      // stop any advances
      for(var i=0;i<self.timeouts.length;i++) {
        $timeout.cancel(self.timeouts[i]);
      }
      self.timeouts = [];
      
      // clear the queues
      self.nowPlaying = null;
      self.playlist = null;
    };


    function advanceSpin() {
      self.nowPlaying = self.playlist.shift();

      // play next song now or when it's done loading
      if (self.nowPlaying && self.nowPlaying.source) {
        self.nowPlaying.source.start(0);
      }
      
      // wait and grab the program
      $timeout(function () {
        refreshProgram();
      }, 2000);

      // set up the next advance
      var newTimeout = $timeout(function () {
        advanceSpin();
      }, new Date(self.playlist[0].startTime).getTime() - Date.now());

      // store it in a list so it can be cancelled
      self.timeouts.push(newTimeout);

    }

    function refreshProgram() {
      Auth.getProgram({  id: self.stationId }, function (err, program) {
        if (err) console.log(err);

        // for now, just one song. later the number of songs will be changed to duration-based
        self.playlist = [program.playlist[0]];

        loadAudio(self.playlist, function () {
          console.log('audioLoaded');
        });
      });
    }

    function createListeningSession() {
      Auth.createListeningSession({ _station: self.stationId,
                                    _user: self.currentUser.id 
                                  }, function (err, listeningSession) {
        self.listeningSessionId = listeningSession._id;
        
        // start updating in 1 minute
        $timeout(function () {
          updateListeningSession();
        }, 60*1000)
      });
    }

    function updateListeningSession() {
      Auth.updateListeningSession({ id: self.listeningSessionId,
                                    _station: self.stationId 
                                  }, function (err, listeningSession) {
        if (listeningSession) {
          self.listeningSessionId = listeningSession._id;
        }
      });
      
      // update again in 60 secs
      $timeout(updateListeningSession, 60*1000);
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

