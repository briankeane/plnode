'use strict';

angular.module('pl2NodeYoApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('songManager', {
        url: '/station/songManager',
        templateUrl: 'app/station/songManager/songManager.html',
        controller: 'SongManagerCtrl',
        authenticate: true
      })

      .state('djBooth', {
        url:'/station/djBooth',
        templateUrl: 'app/station/djBooth/djBooth.html',
        controller: 'djBoothCtrl',
        authenticate: true
      });
  });