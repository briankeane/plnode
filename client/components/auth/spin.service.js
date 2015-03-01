'use strict';

angular.module('pl2NodeYoApp')
  .factory('Spin', function ($resource) {
    return $resource('/api/v1/spins/:id/:controller', {
      id: '@_id'
    },
    {
      move: {
        method: 'PUT',
        params: {
          controller:'move'
        }
      },
      remove: {
        method: 'DELETE',
        params: {
          controller: 'remove'
        }
      }
    });
  });
