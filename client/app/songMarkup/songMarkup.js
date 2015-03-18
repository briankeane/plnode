'use strict';

angular.module('pl2NodeYoApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('songMarkup', {
        url: '/songMarkup',
        templateUrl: 'app/songMarkup/songMarkup.html',
        controller: 'SongMarkupCtrl'
      });
  });