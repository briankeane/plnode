'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongMarkupCtrl', function ($scope, Auth, $timeout) {
    $scope.songsToMarkup = [];
    $scope.currentStation = Auth.getCurrentStation();
    $scope.waveforms;

    $timeout(function () {

    Auth.getRotationItems($scope.currentStation.id, function (err, rotationItems) {
      if (err) { console.log(err); }
      var activeSongs = rotationItems.active;
      for (var i=0;i<activeSongs.length;i++) {
        if (!activeSongs[i]._song.eom || !activeSongs[i]._song.boo || !activeSongs[i]._song.eoi) {
          $scope.songsToMarkup.push(activeSongs[i]._song);
        }

        // limit it to 10 songs
        if ($scope.songsToMarkup.length >= 10) {
          break;
        }
      }
    });
  }, 1000);

    $scope.loadWaveform = function (index, url) {
      console.log('#' + 'song' + index);
      $timeout(function () {

      var wavesurfer = Object.create(WaveSurfer);
      wavesurfer.init({
        container: '#' + 'song' + index,
        waveColor: 'violet',
        progressColor: 'purple',
      });
      wavesurfer.load(url);
      $scope.songsToMarkup.wavesurfer = wavesurfer;
    }, 1000);
    };
  });
