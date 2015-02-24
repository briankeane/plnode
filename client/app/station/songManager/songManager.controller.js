'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongManagerCtrl', function ($scope, Auth, $location, $window, $timeout) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
    
    $scope.getRotationItems = function() {
      Auth.getRotationItems($scope.currentStation._id, function (err, rotationItems) {
        console.log(rotationItems);
        $scope.rotationItems = rotationItems;
      });
    }
    $scope.currentStation = Auth.getCurrentStation()
    console.log($scope.currentStation);
    $scope.currentUser = Auth.getCurrentUser();

    if (!$scope.currentStation._id) {
      $timeout(function () {
        $scope.getRotationItems();
      }, 1000);
    } else {
      $scope.getRotationItems();
    }


  });