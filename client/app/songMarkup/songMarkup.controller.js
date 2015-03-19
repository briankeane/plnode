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
        if (!activeSongs[i]._song.eom || (!activeSongs[i]._song.boo) || (!activeSongs[i]._song.eoi === undefined)) {
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
      // wait for waveform to exist
      $timeout(function () {
        var wavesurfer = Object.create(WaveSurfer);
        wavesurfer.init({
          container: '#' + 'song' + index,
          waveColor: 'violet',
          progressColor: 'purple',
        });
        wavesurfer.load(url);
        $scope.songsToMarkup[index].wavesurfer = wavesurfer;
      }, 1000);
    };

    $scope.markBOO = function (index) {
      $scope.songsToMarkup[index].boo = Math.round($scope.songsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOI = function (index) {
      $scope.songsToMarkup[index].eoi = Math.round($scope.songsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOM = function (index) {
      $scope.songsToMarkup[index].eom = Math.round($scope.songsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };

    $scope.saveSong = function(index) {
      // create a copy to send without the wavesurfer object
      var song = jQuery.extend({}, $scope.songsToMarkup[index]);

      if ((song.eoi != null) && song.boo && song.eom) {
        Auth.updateSong({ _id: song.id,
                          eom: song.eom,
                          boo: song.boo,
                          eoi: song.eoi
                        }, function (err, updatedSong) {
          if (!err) {
            $scope.songsToMarkup.splice(index, 1);
          }
        });
      }
    }
  });
