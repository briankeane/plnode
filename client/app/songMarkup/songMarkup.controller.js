'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongMarkupCtrl', function ($scope, Auth, $timeout) {
    $scope.rotItemsToMarkup = [];
    $scope.currentStation = Auth.getCurrentStation();
    $scope.waveforms;

    $timeout(function () {

    Auth.getRotationItems($scope.currentStation.id, function (err, rotationItems) {
      if (err) { console.log(err); }
      var activeRotationItems = rotationItems.active;
      for (var i=0;i<activeRotationItems.length;i++) {
        if (!activeRotationItems[i].eom || (!activeRotationItems[i].boo) || (!activeRotationItems[i].eoi === undefined)) {
          $scope.rotItemsToMarkup.push(activeRotationItems[i]);
        }

        // limit it to 10 songs
        if ($scope.rotItemsToMarkup.length >= 10) {
          break;
        }
      }
    });
  }, 1000);

    $scope.loadWaveform = function (index, url) {
      // wait for waveform to exist
      $timeout(function () {
        var wavesurfer = Object.create(WaveSurfer);
        wavesurfer.init({
          container: '#' + 'rotationItem' + index,
          waveColor: 'violet',
          progressColor: 'purple',
        });
        wavesurfer.load(url);
        $scope.rotItemsToMarkup[index].wavesurfer = wavesurfer;
      }, 1000);
    };

    $scope.markBOO = function (index) {
      $scope.rotItemsToMarkup[index].boo = Math.round($scope.rotItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOI = function (index) {
      $scope.rotItemsToMarkup[index].eoi = Math.round($scope.rotItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOM = function (index) {
      $scope.rotItemsToMarkup[index].eom = Math.round($scope.rotItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };

    $scope.saveMarks = function(index) {
      var rotationItem = $scope.rotItemsToMarkup[index];
      
      // if all info is complete
      if ((rotationItem.eoi != null) && rotationItem.boo && rotationItem.eom) {
        Auth.updateRotationItem({ _id: rotationItem._id,
                          eom: rotationItem.eom,
                          boo: rotationItem.boo,
                          eoi: rotationItem.eoi
                        }, function (err, updatedRotationItems) {
          if (!err) {
            $scope.rotItemsToMarkup.splice(index, 1);
          }
        });
      }
    }
  });
