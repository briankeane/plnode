'use strict';

angular.module('pl2NodeYoApp')
  .factory('Upload', function ($resource) {
    return $resource('/api/v1/uploads/:id/:controller', {
      id: '@_id'
    },
    {
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      },
      resubmitWithEchonestId: {
        method: 'PUT',
        params: {
          controller: 'resubmitWithEchonestId'
        }
      }
    });
  });