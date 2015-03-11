'use strict';

angular.module('pl2NodeYoApp')
  .controller('ListenIndexCtrl', function ($scope, Auth, $location, $window, $timeout, AudioPlayer) {
    
    $scope.timeouts = [];


    $timeout(function () {
      Auth.getTwitterFriends(function (err, result) {
        console.log(result.friends);
        $scope.twitterFriends = result.friends;

        // grab the program for each station
        for(var i=0;i<$scope.twitterFriends.length;i++) {
          refreshProgram($scope.twitterFriends[i]);
        }
      })
    }, 1000);

    $scope.playStation = function (stationId) {
      AudioPlayer.loadStation(stationId);
    }

    function refreshProgram(friend) {
      Auth.getProgram({  id: friend._station._id }, function (err, program) {
        friend.program = program;

        var newTimeout = $timeout(function () {
          refreshProgram(friend);
        }, new Date(program.nowPlaying.endTime).getTime() - Date.now() + 2000);   // add 2 secs to make sure nowPlaying has actually changed

        $scope.timeouts.push(newTimeout);
      });
    }

    $scope.$on('destroy', function (event) {
      $timeout.cancel($scope.timeouts);
    })
  });
