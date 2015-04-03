'use strict';

angular.module('pl2NodeYoApp')
  .controller('AudioPlayerCtrl', function ($scope, $location, Auth, AudioPlayer, $timeout) {

    $scope.presets = [];
    
    // wait for loading and grab presets
    $timeout(function () {
      Auth.getPresets(function (err, result) {
        $scope.presets = result.presets;
        console.log(result);
      })
    }, 1000);
    // grab currenStation
    $scope.currentStation = Auth.getCurrentStation();

    // grab Rotation Items
    $scope.rotationItems = [];
    $scope.rotationItemAudioBlockIds = [];
    $timeout(getRotationItems, 2000);

    // grab the current user
    $scope.currentUser = Auth.getCurrentUser();
    
    $scope.isCollapsed = false;
    $scope.player = AudioPlayer;
    $scope.volume;

    $scope.addToMyStation = function(songId) {
      alert('hi' + songId);
      Auth.createRotationItem({ weight: 17,
                                  bin: 'active',
                                  _song: songId }, function (err, results) {
        console.log(results);
      });
    };

    $scope.checkForRotation = function (audioBlockId) {
      return ($scope.rotationItemAudioBlockIds.indexOf(audioBlockId) > -1);
    };

    // checks to see if the station is already in the presets
    $scope.isInPresets = function (id) {
      // if it's the user's own station, return true
      if (id === $scope.currentStation._id) {
        return true;
      }
      
      // check the array
      for (var i=0;i<$scope.presets.length;i++) {
        // if it's this station or it's included in
        if ($scope.presets[i]._id === id) {
          return true;
        }
      }
      return false;
    }

    $scope.presetButtonInfo = function (stationId) {
      if ($scope.currentStation._id === stationId) {
        return { text: 'Add Station to Presets',
                 disabled: true };
      } else if ($scope.isInPresets(stationId)) {
        return { text: 'Remove From Presets',
                 inPresets: true,
                 disabled: false };
      } else {
        return { text: 'Add Station to Presets',
               inPresets: false,
               disabled: false };
      }
    }

    $scope.togglePreset = function (station) {
      // if it's already in the presets, take it out
      if ($scope.isInPresets(station._id)) {
        Auth.unfollow(station._id, function (err, result) {

        });

        // find the selected in the presets array and remove it
        for (var i=0;i<$scope.presets.length;i++) {
          if ($scope.presets[i]._station._id === station._id) {
            $scope.presets.splice(i,1);
            break;
          }
        }

      // otherwise put it in
      } else {

        Auth.follow(station._id, function (err, result) {
          console.log(result);
          $scope.presets = result.presets;
        });

        // temporarily include it until the response comes back
        $scope.presets.push({ _station: station });
      }
    }

    function getRotationItems() {
      if ($scope.currentStation._id) {

        Auth.getRotationItems($scope.currentStation._id, function (err, rotationItems) {
          $scope.rotationItems = rotationItems;
          $scope.rotationItemAudioBlockIds = [];
          for(var i=0;i<rotationItems.active.length;i++) {
            $scope.rotationItemAudioBlockIds.push(rotationItems.active[i]._song._id);
          }
        });
      } else {
        $timeout(getRotationItems, 5000);
      }
    }


  });