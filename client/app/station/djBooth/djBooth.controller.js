'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($scope, Auth, $location, $window, $timeout) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
  });