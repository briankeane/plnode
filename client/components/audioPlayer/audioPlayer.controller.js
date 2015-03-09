'use strict';

angular.module('pl2NodeYoApp')
  .controller('AudioPlayerCtrl', function ($scope, $location, Auth, AudioPlayer) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.test = 'DOH!'
    $scope.isCollapsed = false;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser();
    console.log('right here');
    $scope.player = AudioPlayer;
    $scope.volume;
  });