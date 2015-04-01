'use strict';

angular.module('pl2NodeYoApp')
  .factory('User', function ($resource) {
    return $resource('/api/v1/users/:id/:controller', {
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
      setZipcode: {
        method: 'PUT',
        params: {
          controller: 'setZipcode'
        }
      },
      getTwitterFriends: {
        method: 'GET',
        params: {
          controller: 'twitterFriends',
          _id: '@_id'
        }
      },
      findByKeywords: {
        method: 'GET',
        params: {
          controller: 'findByKeywords'
        }
      }
	  });
  });
