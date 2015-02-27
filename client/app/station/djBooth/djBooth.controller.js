'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($scope, Auth, $location, $window, $timeout) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};

    $scope.currentStation = Auth.getCurrentStation()
    $scope.currentUser = Auth.getCurrentUser();

    if (!$scope.currentStation._id) {
      $timeout(function () {
        Auth.getProgram({});
      }, 1000);
    } else {
      Auth.getProgram({});
    }
  });