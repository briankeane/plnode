'use strict';

angular.module('pl2NodeYoApp')
  .service('CommentaryPreviewPlayer', function ($rootScope, $interval, $timeout, Auth) {

    // initialize variables
    var self = this;
    self.currentUser = Auth.getCurrentUser();
    self.muted = false;

    // set up audio context and audio nodes
    if (!self.context) {
      if ('webkitAudioContext' in window) {
        self.context = new webkitAudioContext;
      } else {
        self.context = new AudioContext();
      }
    }

    // Create a compressor node
    self.compressor = self.context.createDynamicsCompressor();
    self.compressor.threshold.value = -20;
    self.compressor.knee.value = 20;
    self.compressor.ratio.value = 10;
    self.compressor.reduction.value = -10;
    self.compressor.attack.value = 0;
    self.compressor.release.value = 0.25;

    // connect context/gain/destination into chain
    self.gainNode = this.context.createGain();
    self.compressor.connect(self.gainNode);
    self.gainNode.connect(this.context.destination);

    this.play = function (previousSpin, commentarySpin, followingSpin) {
      // load all audioBlocks
      // set the gain node just in case it's a replay
      //self.gainNode.gain.value = 1;
      var loadedCounter = 0;
      loadAudio([previousSpin, commentarySpin, followingSpin], function () {
        
        // if all 3 are loaded...
        loadedCounter++;
        if (loadedCounter == 3) {
          // get all airtimes in ms
          var previousSpinAirtimeMS = new Date(previousSpin.airtime).getTime();
          var commentarySpinAirtimeMS = new Date(commentarySpin.airtime).getTime();
          var followingSpinAirtimeMS = new Date(followingSpin.airtime).getTime();

          // get place in first spin to start (previousSpinMS) (3 secs before 1st changeover);
          var previousSpinStartSecs = (commentarySpinAirtimeMS - previousSpinAirtimeMS - 3000)/1000;
          var scheduledSpinStartTimeMS = new Date(previousSpin.airtime).getTime() + previousSpinStartSecs*1000;


          // grab timeOffset
          var timeOffsetMS = scheduledSpinStartTimeMS - new Date().getTime();

          // start the first spin
          previousSpin.source.start(0, previousSpinStartSecs);

          // schedule the next spins
          $timeout(function () {
            commentarySpin.source.start(0);
          }, 3000);

          console.log('ms till next start time: ' + new Date(new Date(followingSpinAirtimeMS).getTime() - timeOffsetMS).getTime());

          $timeout(function () {
            followingSpin.source.start(0);
          }, (followingSpinAirtimeMS - commentarySpinAirtimeMS + 3000));

          // schedule fadeout after finished
          $timeout(function () {
            self.gainNode.gain.linearRampToValueAtTime(0, self.context.currentTime + 2);
            
            // wait a couple seconds... then remove the sources
            $timeout(function () {
              previousSpin.source = null;
              commentarySpin.source = null;
              followingSpin.source = null;
            }, 2000)  
          }, commentarySpin._audioBlock.duration + 3000);

        }
      });
    }


    // loadAudio only works for 1 element arrays right now
    function loadAudio(spins, callback) {
      var cb = callback || angular.noop;
      var context = self.context;
      

      // load each element
      for (var i=0;i<spins.length;i++) {
        // if it hasn't been done already... 
        var spin = spins[i];

        if (!spin.source) {
          spin.request = new XMLHttpRequest();
          spin.request.open('GET', spin._audioBlock.audioFileUrl, true);
          spin.request.responseType = 'arraybuffer';

          // decode
          (function (spin) {
            spin.request.onload = function () {
              context.decodeAudioData(spin.request.response, function (buffer) {
                var source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(self.gainNode);

                spin.source = source;
                cb();
              });
            };
          })(spin);
        spin.request.send();
        }
      }
    }
  })