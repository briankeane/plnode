'use strict';

angular.module('pl2NodeYoApp')
  .factory('Station', function ($resource) {
    return $resource('/api/v1/stations/:id/:controller', {
      id: '@_id'
    },
    {
      changePassword: {
        method: 'PUT',
        params: {
          controller:'password'
        }
      },
      update: {
        method: 'PUT',
        params: {
          controller:'update'
        }
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      }
    });
  });
