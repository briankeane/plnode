'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongManagerCtrl', function ($scope, Auth, $location, $window, $timeout) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
    $scope.catalogSearchResults = [];
    $scope.rotationItems = [];
    $scope.rotationItemsPendingRemoval = [];
    
    $scope.getRotationItems = function() {
      Auth.getRotationItems($scope.currentStation._id, function (err, rotationItems) {
        console.log(rotationItems);
        $scope.rotationItems = rotationItems.active.sort(function (a,b) {
          if (a._song.artist.toLowerCase() > b._song.artist.toLowerCase()) {
            return 1;
          } else if (a._song.artist.toLowerCase() < b._song.artist.toLowerCase()) {
            return -1;
          } else {
            return 0;
          }
        });
      });
    }

    $scope.removeRotationItem = function(rotationItem) {
      if ($scope.rotationItems.length <= 45) {
        $scope.rotationItemsMessage = "Sorry... you'll have to add a song first.";
      } else {
        // remove from the array
        for (var i=0;i<$scope.rotationItems.length; i++) {
          if ($scope.rotationItems[i]._id === rotationItem._id) {
            var removedItem = $scope.rotationItems.splice(i,1)[0];
            var removedItemInfo = { item: removedItem,
                                      index: i};
            break;
          }

        }
        Auth.removeRotationItem(rotationItem._id, function (err, rotationItems) {
          // if unable to delete, put rotationItem back and inform user
          if (err) { 
            $scope.rotationItems.splice(removedItemInfo.index, 0, removedItemInfo.item).join();
            $scope.rotationItemsMessage = "Error: Unable to delete: " + removedItemInfo.item._song.title +
                                                    " by " + removedItemInfo.item._song.artist +
                                                    ".  Please try again.";
          }
        });
      }
    };

    $scope.findSongs = function (searchString) {
      if (searchString.length <= 3) {
        $scope.catalogSearchResults = [];
      } else {
        Auth.findSongsByKeywords(searchString, function (err, results) {
          if (err) { console.log(err); }
          if (results) {
            $scope.catalogSearchResults = results;
            console.log(results);
          }
        });
      }
    };


    $scope.currentStation = Auth.getCurrentStation()
    console.log($scope.currentStation);
    $scope.currentUser = Auth.getCurrentUser();

    if (!$scope.currentStation._id) {
      $timeout(function () {
        $scope.getRotationItems();
      }, 1000);
    } else {
      $scope.getRotationItems();
    }

  });