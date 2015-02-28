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

    var playlistSet = false;
    var progressUpdater;


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
            console.log(results);
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

    $scope.refreshProgram = function () {
      Auth.getProgram({}, function (err, program) {
        if (err) return (err);

        if ($scope.nowPlaying._id != program.nowPlaying._id) {
          $scope.nowPlaying = program.nowPlaying;
        }

        $scope.playlist = program.playlist;
      });
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

      // advance to current spin
      while(Date.now() < $scope.playlist[0].airtime) {
        $scope.playlist.unshift();
      }

      $scope.refreshProgram();
      
      // set up next advance
      var msTillNextAdvance = new Date($scope.playlist[0].airtime).getTime() - Date.now();
      $timeout($scope.advanceSpin, msTillNextAdvance);
    }

    // if there's not a  currentStation yet, wait for it
    if (!$scope.currentStation._id) {
      $timeout($scope.setPlaylist, 1000);
    } else {
      $scope.setPlaylist();
    }


  });