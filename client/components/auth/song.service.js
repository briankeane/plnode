'use strict';

angular.module('pl2NodeYoApp')
  .factory('Song', function ($resource) {
    return $resource('/api/v1/songs/:id/:controller', {
      id: '@_id'
    },
    {
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      },
      findByKeywords: {
        method: 'GET',
        params: {
          controller: 'findByKeywords'
        }
      },
      update: {
        method: 'PUT'
      }
    });
  });