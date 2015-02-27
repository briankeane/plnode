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
      },
      create: {
        method: 'POST'
      },
      getRotationItems: {
        method: 'GET',
        params: {
          controller: 'getRotationItems'
        }
      },
      removeRotationItem: {
        method: 'PUT',
        params: {
          controller: 'removeRotationItem'
        }
      },
      updateRotationWeight: {
        method: 'PUT',
        params: {
          controller: 'updateRotationWeight'
        }
      },
      createRotationItem: {
        method: 'POST',
        params: {
          controller: 'createRotationItem'
        }
      },
      getProgram: {
        method: 'GET',
        params: {
          controller: 'getProgram'
        }
      }
    });
  });
