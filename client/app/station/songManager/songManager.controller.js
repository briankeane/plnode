'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongManagerCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};

    $scope.getCurrentUser = Auth.getCurrentUser;
    
  });