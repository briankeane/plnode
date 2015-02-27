'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($scope, Auth, $location, $window, $timeout) {
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


    if (!$scope.currentStation._id) {
      $timeout(function () {
        Auth.getProgram({}, function (err, program) {

          $scope.playlist = program.playlist;
          $scope.nowPlaying = program.nowPlaying;
        });
      }, 1000);
    } else {
      Auth.getProgram({}, function (err, program) {
        $scope.playlist = program.playlist;
        $scope.nowPlaying = program.nowPlaying;
      });

    }
  });