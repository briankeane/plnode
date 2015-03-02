'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($scope, Auth, $location, $window, $timeout, moment, $interval) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
    $scope.playlist = [];
    $scope.catalogSearchResults = [];

    $scope.currentStation = Auth.getCurrentStation()
    $scope.currentUser = Auth.getCurrentUser();

    var nextAdvance;
    var playlistSet = false;
    var progressUpdater;
    var lastUpdateIndex = 0;


    // ******************************************************************
    // *                 Server Request Functions                       *
    // ******************************************************************
    $scope.findSongs = function (searchString) {
      if (searchString.length <= 3) {
        $scope.catalogSearchResults = [];
      } else {
        Auth.findSongsByKeywords(searchString, function (err, results) {
          if (err) { console.log(err); }
          if (results) {
            if ($scope.searchText === searchString) {
              $scope.catalogSearchResults = results;
            }
          }
        });
      }
    };

    $scope.setPlaylist = function () {
      Auth.getProgram({}, function (err, program) {
        if (err) {
          return (err);
        } else {

          moment.tz.setDefault($scope.currentStation.timezone);

          $scope.playlist = program.playlist;
          $scope.nowPlaying = program.nowPlaying;
          
          progressUpdater = $interval($scope.updateProgressBar, 1000);
          playlistSet = true;

          // set up first advance
          var msTillNextAdvance = new Date($scope.playlist[0].airtime).getTime() - Date.now();
          $timeout($scope.advanceSpin, msTillNextAdvance);
        }
      });
    };

    $scope.refreshProgramFromServer = function () {
      Auth.getProgram({}, function (err, program) {
        if (err) return (err);

        if ($scope.nowPlaying._id != program.nowPlaying._id) {
          $scope.nowPlaying = program.nowPlaying;
        }

        $scope.playlist = program.playlist;
      });
    }

    $scope.refreshProgramWithoutServer = function () {
      var timeTracker =  moment($scope.playlist[0].airtime);
      var playlistPositionTracker = $scope.playlist[0].playlistPosition;

      for (var i=0;i<$scope.playlist.length;i++) {
        // reset new values
        $scope.playlist[i].airtime = moment(timeTracker).toDate();
        $scope.playlist[i].endTime = moment(timeTracker).add($scope.playlist[i].duration, 'ms').toDate();
        $scope.playlist[i].playlistPosition = playlistPositionTracker;
        $scope.playlist[i].commercialsFollow = $scope.commercialsFollow($scope.playlist[i].airtime.getTime(), new Date($scope.playlist[i].endTime).getTime());
        
        // increment timeTracker
        timeTracker.add($scope.playlist[i].duration, 'ms');
        if ($scope.playlist[i].commercialsFollow) {
          timeTracker.add($scope.currentStation.secsOfCommercialPerHour/2, 'seconds');
        }

        playlistPositionTracker++;
      }
    }

    $scope.commercialsFollow = function (startTimeMS, endTimeMS) {
      // if beginning and end of spin are in different time 'blocks'
      return (Math.floor(startTimeMS/1800000.0) != Math.floor(endTimeMS/1800000.0))
    }

    $scope.formatTime = function (time) {
      return moment(time).format("MMM Do, h:mm:ss a")
    };

    $scope.updateProgressBar = function () {
      var elapsedTime = Date.now() - new Date($scope.nowPlaying.airtime).getTime();
      var msRemaining = new Date($scope.nowPlaying.endTime).getTime() - Date.now();
      var songPercentComplete = elapsedTime/(elapsedTime + msRemaining)*100;

      // never let songPercentComplete get over 100
      if (songPercentComplete > 100) {
        songPercentComplete = 100;
      }
      $scope.songPercentComplete = songPercentComplete;
      
      // never let elasped get bigger than duration
      if (elapsedTime > $scope.nowPlaying.duration) {
        elapsedTime = $scope.nowPlaying.duration;
      }
      $scope.nowPlayingElapsedString = $scope.formatSongTimerFromMS(elapsedTime);
      
      // never let msRemaining go negative
      if (msRemaining < 0) {
        msRemaining = 0;
      }
      $scope.nowPlayingRemainingString = $scope.formatSongTimerFromMS(msRemaining);
    }

    $scope.formatSongTimerFromMS = function (milliseconds) {
      var totalSeconds = milliseconds/1000;
      var secs = Math.floor(totalSeconds % 60) ;
      var mins = Math.floor((totalSeconds - secs)/60);
      var hrs = Math.floor(((totalSeconds - secs - (mins * 60))/60));

      if (secs < 10) {
        secs = "0" + secs;
      }

      if (hrs > 0) {
        return '' + hrs + ':' + mins + ':' + secs;
      } else {
        return '' + mins + ':' + secs;
      }
    }

    $scope.advanceSpin = function () {
      // advance spin
      if ($scope.nowPlaying.commercialsFollow) {
        $scope.nowPlaying = { _audioBlock: { type: 'CommercialBlock'},
                        airtime: $scope.nowPlaying.endTime,
                        endTime: $scope.playlist[0].airtime }
      } else {
        $scope.nowPlaying = $scope.playlist.shift();
      }

      $scope.refreshProgramFromServer();
      
      // set up next advance
      var msTillNextAdvance = new Date($scope.playlist[0].airtime).getTime() - Date.now();
      $timeout($scope.advanceSpin, msTillNextAdvance);
    }


    $scope.movedSpin = function (oldIndex, event, spin) {
      oldIndex = oldIndex - 1;   // adjustment for leading commercialBlock
      // find new index
      var newPlaylistPosition;
      var newIndex;

      for (var i=0;i<$scope.playlist.length;i++) {
        if ($scope.playlist[i]._id === spin._id) {
          newIndex = i;

          // adjustment for strange newIndex offset
          if (newIndex > oldIndex) {
            oldIndex++;
          }
          var movedAmount = (newIndex - oldIndex);
          newPlaylistPosition = spin.playlistPosition + movedAmount;
          break;
        }
      }

      if (movedAmount === 0) { 
        return false; 
      } else {
        $scope.refreshProgramWithoutServer();

        Auth.moveSpin({ spin: spin, newPlaylistPosition: newPlaylistPosition }, function (err, newProgram) {
          if (err) { return false; }
          $scope.playlist = newProgram.playlist;
        });
      }
    }

    $scope.removeSpin = function (spin, index) {
      $scope.playlist.splice(index,1);

      $scope.refreshProgramWithoutServer();

      Auth.removeSpin(spin, function (err, newProgram) {
        if (err) return false;
        $scope.playlist = newProgram.playlist;
      })
    }

    $scope.audioDropped = function (event, index, item, type) {
      // grab the start time
      if (item._type === 'Song') {
        
        // create the new spin object
        var newSpin = { _audioBlock: item,
                        duration: item.duration,
                        durationOffset: 0,
                        playlistPosition: $scope.playlist[index].playlistPosition
                      }

        // insert the new spin
        $scope.playlist.splice(index, 0, newSpin);

        // update playlistPositions
        for (var i=index+1;i<$scope.playlist.length;i++) {
          $scope.playlist[i].playlistPosition += 1;
        }

        $scope.refreshProgramWithoutServer();

        // notify server and refresh list
        Auth.insertSpin({ playlistPosition: newSpin.playlistPosition,
                          _audioBlock: newSpin._audioBlock._id,
                          _station: $scope.currentStation._id 
                        }, function (err, newProgram) {
          if (err) { return false; }
          $scope.playlist = newProgram.playlist;
        });
      }  //ENDIF
    };

    // for now disable 1st two elements
    $scope.determineDisable = function (spin, index) {
      if ($scope.playlist[0].commercialsFollow || $scope.nowPlaying.commercialsFollow) {
        if (index < 1) {
          return true;
        } else {
          return false;
        }
      } else if (index < 2) {
        return true;
      } else {
        return false;
      }
    }

    // if there's not a  currentStation yet, wait for it
    if (!$scope.currentStation._id) {
      $timeout($scope.setPlaylist, 1000);
    } else {
      $scope.setPlaylist();
    }
  });