'use strict';

angular.module('pl2NodeYoApp')
  .factory('RotationItem', function ($resource) {
    return $resource('/api/v1/rotationItems/:id/:controller', {
      id: '@_id'
    },
    {
      update: {
        method: 'PUT',
        params: {
          id: '_id'
        }
      }
    });
  });