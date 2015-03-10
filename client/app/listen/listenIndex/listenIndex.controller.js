'use strict';

angular.module('pl2NodeYoApp')
  .controller('ListenIndexCtrl', function ($scope, Auth, $location, $window, $timeout) {
    $timeout(function () {
      Auth.getTwitterFriends(function (err, result) {
        console.log(result.friends);
        $scope.twitterFriends = result.friends;
      
      });
    }, 1000);
  })