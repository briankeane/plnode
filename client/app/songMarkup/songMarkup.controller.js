'use strict';

angular.module('pl2NodeYoApp')
  .controller('SongMarkupCtrl', function ($scope, Auth, $timeout) {
    $scope.rotationItemsToMarkup = [];
    $scope.currentStation = Auth.getCurrentStation();
    $scope.waveforms;
    $scope.context = new AudioContext();

    $scope.beep = function () {
      var source = $scope.context.createOscillator();
      source.connect($scope.context.destination);
      source.start(0);
      $timeout(function () {
        source.stop()
      }, 100);
    }



    $timeout(function () {
      Auth.getRotationItems($scope.currentStation.id, function (err, rotationItems) {
        if (err) { console.log(err); }
        var activeRotationItems = rotationItems.active;
        for (var i=0;i<activeRotationItems.length;i++) {
          //if (!activeRotationItems[i].eom || (!activeRotationItems[i].boo) || (!activeRotationItems[i].eoi === undefined)) {
            $scope.rotationItemsToMarkup.push(activeRotationItems[i]);
          //}

          // limit it to 10 songs
          if ($scope.rotationItemsToMarkup.length >= 10) {
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
        $scope.rotationItemsToMarkup[index].wavesurfer = wavesurfer;

        // set up the marking regions
        wavesurfer.on('ready', function () {
          // setup markups
          var markups = secsFromMarkup($scope.rotationItemsToMarkup[index].eoi);
          wavesurfer.addRegion({ start: markups.start,
                                  end: markups.end,
                                  color: "rgb(0,0,150)",
                                  loop: false,
                                  resize: false,
                                  id: 'eoi' })

          markups = secsFromMarkup($scope.rotationItemsToMarkup[index].boo);
          wavesurfer.addRegion({ start: markups.start,
                                  end: markups.end,
                                  color: "rgb(0,150,0)",
                                  loop: false,
                                  resize: false,
                                  id: 'boo' })
          markups = secsFromMarkup($scope.rotationItemsToMarkup[index].eom);
          wavesurfer.addRegion({ start: markups.start,
                                  end: markups.end,
                                  color: "rgb(150,0,0)",
                                  loop: false,
                                  resize: false,
                                  id: 'eom' })

          wavesurfer.on('region-in', function (regionObject) {
            $scope.beep();
          });
        })

      }, 1000);
    };

    $scope.markBOO = function (index) {
      $scope.rotationItemsToMarkup[index].boo = Math.round($scope.rotationItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOI = function (index) {
      $scope.rotationItemsToMarkup[index].eoi = Math.round($scope.rotationItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };
    $scope.markEOM = function (index) {
      $scope.rotationItemsToMarkup[index].eom = Math.round($scope.rotationItemsToMarkup[index].wavesurfer.getCurrentTime() * 1000);
    };

    $scope.saveMarks = function(index) {
      var rotationItem = $scope.rotationItemsToMarkup[index];
      
      // if all info is complete
      if ((rotationItem.eoi != null) && rotationItem.boo && rotationItem.eom) {
        Auth.updateRotationItem({ _id: rotationItem._id,
                          eom: rotationItem.eom,
                          boo: rotationItem.boo,
                          eoi: rotationItem.eoi
                        }, function (err, updatedRotationItems) {
          if (!err) {
            $scope.rotationItemsToMarkup.splice(index, 1);
          }
        });
      }
    }

    // gives the region width if the markup exists, no width if it doesn't
    function secsFromMarkup(markupMS) {
      if (markupMS === undefined) {
        return { start: 0, end: 0 };
      } else {
        return { start:markupMS/1000.0, end: markupMS/1000.0 + 1 };
      }
    }
  });
