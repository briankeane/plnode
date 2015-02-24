'use strict';

angular.module('pl2NodeYoApp')
  .factory('Auth', function Auth($location, $rootScope, $http, User, Station, $cookieStore, $q) {
    var currentUser = {};
    var currentStation = {};
    if($cookieStore.get('token')) {
      currentUser = User.get()
      currentStation = Station.get();
    }

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
       
      login: function(user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.post('/auth/local', {
          email: user.email,
          password: user.password
        }).
        success(function(data) {
          $cookieStore.put('token', data.token);
          currentUser = User.get();
          currentStation = Station.get();
          deferred.resolve(data);
          return cb();
        }).
        error(function(err) {
          this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));

        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        $cookieStore.remove('token');
        currentUser = {};
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function(user, callback) {
        var cb = callback || angular.noop;

        return User.save(user,
          function(data) {
            $cookieStore.put('token', data.token);
            currentUser = User.get();
            return cb(user);
          },
          function(err) {
            this.logout();
            return cb(err);
          }.bind(this)).$promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return User.changePassword({ id: currentUser._id }, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Update User
       *
       * @param  {}       updatesObject
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      updateUser: function (updatesObject, callback) { 
        var cb = callback || angular.noop;

        return User.update({ id: currentUser._id }, updatesObject, function (user) {
          return cb(user);
        }, function (err) {
          return cb(err);
        }).$promise;
      },
      /**
       * Set User Zipcode
       *
       * @param  String     newZipcode
       * @param  {Function} callback    - optional
       * @return {Promise}
       *
       * Looks up timezone and sets it and zipcode for the user
       *
       * @return {Object} user
       */
      setZipcode: function(newZipcode, callback) {
        var cb = callback || angular.noop;

        return User.setZipcode({ id: currentUser._id }, { zipcode: newZipcode }, function (user) {
          return cb(null, user);
        }, function (err) {
          return cb(err);
        }).$promise;
      },

      createStation: function (stationObject, callback) {
        var cb = callback || angular.noop;

        return Station.create({ _user: currentUser._id }, stationObject, function (station) {
          currentStation = station;
          currentUser._station = station;
          return cb(null, station);
        }, function (err) {
          return cb(err);
        }).$promise;
      },

      getCurrentStation: function() {
        return currentStation;
      },

      getCurrentUser: function() {
        return currentUser;
      },
      
      getRotationItems: function(_station, callback) {
        var cb = callback || angular.noop;

        return Station.getRotationItems({}, { _id: currentStation._id }, function (rotationItems) {
          return cb(null, rotationItems.rotationItems);
        }, function (err) {
          return cb(err);
        }).$promise;
      },

      removeRotationItem: function (rotationItemId, callback) {
        var cb = callback || angular.noop;

        return Station.removeRotationItem({ id: currentStation._id, rotationItemId: rotationItemId }, { rotationItemId: rotationItemId }, function (updatedRotationItems) {
          return cb(null, updatedRotationItems.rotationItems)
        }, function (err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {
        return currentUser.hasOwnProperty('role');
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function(cb) {
        if(currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function() {
            cb(true);
          }).catch(function() {
            cb(false);
          });
        } else if(currentUser.hasOwnProperty('role')) {
          cb(true);
        } else {
          cb(false);
        }
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function() {
        return currentUser.role === 'admin';
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return $cookieStore.get('token');
      }
    };
  });
