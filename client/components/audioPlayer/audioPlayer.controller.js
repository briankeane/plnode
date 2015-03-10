'use strict';

angular.module('pl2NodeYoApp')
  .controller('AudioPlayerCtrl', function ($scope, $location, Auth, AudioPlayer, $timeout) {

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

    function getRotationItems() {
      Auth.getRotationItems($scope.currentStation._id, function (err, rotationItems) {
        $scope.rotationItems = rotationItems;
        $scope.rotationItemAudioBlockIds = [];
        for(var i=0;i<rotationItems.active.length;i++) {
          $scope.rotationItemAudioBlockIds.push(rotationItems.active[i]._song._id);
        }
      });
    }


  });