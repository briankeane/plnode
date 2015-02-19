'use strict';

angular.module('pl2NodeYoApp')
  .controller('GetUserInfoCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};
    $scope.artist1 = '';

    $scope.updateInitialUserInfo = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        
        Auth.updateUser({
          birthYear: $scope.user.birthYear,
          gender: $scope.user.gender
        })
        .then( function() {
          Auth.setZipcode($scope.user.zipcode)
          .then( function () {
            // All updated, redirect home
            $location.path('/');
          })
        })
        .catch( function(err) {
          err = err.data;
          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
