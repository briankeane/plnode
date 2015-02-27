'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($scope, Auth, $location, $window, $timeout, moment) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
    $scope.playlist = [];
    $scope.catalogSearchResults = [];

    $scope.currentStation = Auth.getCurrentStation()
    $scope.currentUser = Auth.getCurrentUser();

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

    $scope.formatTime = function (time) {
      return moment(time).format("MMM Do, h:mm:ss a")
    };


    if (!$scope.currentStation._id) {
      $timeout(function () {
        Auth.getProgram({}, function (err, program) {
          moment.tz.setDefault($scope.currentStation.timezone);
          $scope.playlist = program.playlist;
          $scope.nowPlaying = program.nowPlaying;
        });
      }, 1000);
    } else {
      moment.tz.setDefault($scope.currentStation.timezone);
      Auth.getProgram({}, function (err, program) {
        $scope.playlist = program.playlist;
        $scope.nowPlaying = program.nowPlaying;
      });

    }
  });