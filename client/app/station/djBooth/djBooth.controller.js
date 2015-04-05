'use strict';

angular.module('pl2NodeYoApp')
  .controller('djBoothCtrl', function ($rootScope, CommentaryPreviewPlayer, AudioPlayer, $scope, FileUploader, Auth, $location, $window, $timeout, moment, $interval, $modal, $sce) {
    $scope.user = {};
    $scope.station = {};
    $scope.errors = {};
    $scope.playlist = [];
    $scope.catalogSearchResults = [];
    $scope.mostRecentCommentary = {};
    
    $scope.player = AudioPlayer;
    $scope.currentStation = Auth.getCurrentStation()
    $scope.currentUser = Auth.getCurrentUser();

    var nextAdvance;
    var playlistSet = false;
    var progressUpdater;
    var lastUpdateIndex = 0;
    var wasMuted;

    // create the commentary uploader
    $scope.FileUploader = FileUploader;
    $scope.uploader = new FileUploader({ url: 'api/v1/commentaries/upload',
                                          autoUpload: true });
    
    // wait a sec for currentStation and load the station
    $timeout(function () {
      AudioPlayer.loadStation($scope.currentStation._id);
    }, 1000);



    // **************************************************************************************
    // *                                Uploader Listeners                                  *
    // **************************************************************************************
    $scope.uploader.onBeforeUploadItem = function (item) {
      item._file = $scope.mostRecentCommentary.blob;
      item.formData.push({ duration: Math.round($scope.mostRecentCommentary.model.duration),
                            _station: $scope.currentStation._id,
                            playlistPosition: $scope.mostRecentCommentary.playlistPosition });
    };

    $scope.uploader.onCompleteItem = function (item, response, status, headers) {
      $scope.playlist = response.playlist;
    }



    // ******************************************************************
    // *                 Server Request Functions                       *
    // ******************************************************************
    $scope.findSongs = function (searchString) {
      if (searchString.length <= 3) {
        $scope.catalogSearchResults = [];
      } else {
        Auth.findSongsByKeywords(searchString, function (err, results) {
          if (err) { console.log(err); }
          if (results) {
            if ($scope.searchText === searchString) {
              $scope.catalogSearchResults = results;
            }
          }
        });
      }
    };

    $scope.setPlaylist = function () {
      Auth.getProgram({}, function (err, program) {
        if (err) {
          return (err);
        } else {

          moment.tz.setDefault($scope.currentStation.timezone);

          $scope.playlist = program.playlist;
          
          progressUpdater = $interval($scope.updateProgressBar, 1000);
          playlistSet = true;
        }
      });
    };

    $scope.refreshProgramFromServer = function () {
      Auth.getProgram({}, function (err, program) {
        if (err) return (err);

        $scope.playlist = program.playlist;
      });
    }


    // ******************************************************************
    // *                      display functions                         *
    // ******************************************************************
    // Allows commentaries to be trusted
    $scope.safeLink = function (audioBlock) {
      if (audioBlock && audioBlock._type === 'Commentary') {
        return $sce.trustAsResourceUrl(audioBlock.audioFileUrl);
      } else {
        return null;
      }
    }

    // determines whether a song needs markings
    $scope.needsMarkup = function (song) {
      return (!song || !song.eom || !song.boo || (song.eoi === undefined));
    }

    $scope.commercialsFollow = function (startTimeMS, endTimeMS) {
      // if beginning and end of spin are in different time 'blocks'
      return (Math.floor(startTimeMS/1800000.0) != Math.floor(endTimeMS/1800000.0))
    }

    $scope.formatTime = function (time) {
      return moment(time).format("MMM Do, h:mm:ss a")
    };

    $scope.formatSongTimerFromMS = function (milliseconds) {
      var totalSeconds = milliseconds/1000;
      var secs = Math.floor(totalSeconds % 60) ;
      var mins = Math.floor((totalSeconds - secs)/60);
      var hrs = Math.floor(((totalSeconds - secs - (mins * 60))/60));

      if (secs < 10) {
        secs = "0" + secs;
      }

      if (hrs > 0) {
        return '' + hrs + ':' + mins + ':' + secs;
      } else {
        return '' + mins + ':' + secs;
      }
    }
    
    // for now disable 1st element
    $scope.determineDisable = function (spin, index) {
      if ($scope.playlist[0].commercialsFollow || AudioPlayer.nowPlaying.commercialsFollow) {
        if (index < 1) {
          return true;
        } else {
          return false;
        }
      } else if (index < 2) {
        return true;
      } else {
        return false;
      }
    }
    $scope.removable = function (spin, index) {
      if (index === 0) {
        return false;
      } else {
        return true;
      }
    }

    $scope.previewCommentary = function (index) {
      CommentaryPreviewPlayer.play($scope.playlist[index-1], $scope.playlist[index], $scope.playlist[index+1]);
    }

    $rootScope.$on('previewPlayerFinishedLoading', function () {
      wasMuted = AudioPlayer.muted;
      if (!wasMuted) {
        AudioPlayer.mute();
      }
    });

    $rootScope.$on('previewFinishedPlaying', function () {
      if (!wasMuted) {
        $timeout(function () {
          AudioPlayer.unmute();
        }, 750);
      }
    })

    $scope.markupSong = function () {
      // make a nice modal later
      alert('This song is not yet marked -- go to the Song Markup page under the Broadcast menu to take care of that');
    }

    // *************************************************************************************
    // ********************************** Playlist Functions *******************************
    // *************************************************************************************

    $scope.refreshProgramWithoutServer = function () {
      var timeTracker =  moment($scope.playlist[0].airtime);
      var playlistPositionTracker = $scope.playlist[0].playlistPosition;

      for (var i=0;i<$scope.playlist.length;i++) {
        // reset new values
        $scope.playlist[i].airtime = moment(timeTracker).toDate();
        $scope.playlist[i].endTime = moment(timeTracker).add($scope.playlist[i].duration, 'ms').toDate();
        $scope.playlist[i].playlistPosition = playlistPositionTracker;
        $scope.playlist[i].commercialsFollow = $scope.commercialsFollow($scope.playlist[i].airtime.getTime(), new Date($scope.playlist[i].endTime).getTime());
        
        // increment timeTracker
        timeTracker.add($scope.playlist[i].duration, 'ms');
        if ($scope.playlist[i].commercialsFollow) {
          timeTracker.add($scope.currentStation.secsOfCommercialPerHour/2, 'seconds');
        }

        playlistPositionTracker++;
      }
    }

    $scope.updateProgressBar = function () {
      if (AudioPlayer.nowPlaying) {

        var elapsedTime = Date.now() - new Date(AudioPlayer.nowPlaying.airtime).getTime();
        var msRemaining = new Date(AudioPlayer.nowPlaying.endTime).getTime() - Date.now();
        var songPercentComplete = elapsedTime/(elapsedTime + msRemaining)*100;

        // never let songPercentComplete get over 100
        if (songPercentComplete > 100) {
          songPercentComplete = 100;
        }
        $scope.songPercentComplete = songPercentComplete;
        
        // never let elasped get bigger than duration
        if (elapsedTime > AudioPlayer.nowPlaying.duration) {
          elapsedTime = AudioPlayer.nowPlaying.duration;
        }
        $scope.nowPlayingElapsedString = $scope.formatSongTimerFromMS(elapsedTime);
        
        // never let msRemaining go negative
        if (msRemaining < 0) {
          msRemaining = 0;
        }
        $scope.nowPlayingRemainingString = $scope.formatSongTimerFromMS(msRemaining);
      }
    }


    $scope.$on('spinAdvanced', function () {
      $scope.playlist.shift();
    });

    $scope.$on('programRefreshed', function (event, program) {
      $scope.playlist = program.playlist;
    });


    // ******************************************************************
    // *               playlist sortable list options                   *
    // ******************************************************************
    $scope.playlistOptions = {
      connectWith: '.catalogList',

      // marks old index for moving spin
      start: function (event, ui) {
        ui.item.oldIndex = ui.item.index();
        ui.item.sortable.model.beingDragged = true;
      },

      // actually moves the spin and notifies the server
      stop: function (event, ui) {
        var oldIndex = ui.item.oldIndex;
        var newIndex = ui.item.index();
        var spin = ui.item.sortable.model;
        var movedAmount = newIndex - oldIndex;
        spin.beingDragged = false;

        // if item was dropped in the same spot, do nothing
        if (movedAmount === 0) {
          return;
        }

        var newPlaylistPosition = spin.playlistPosition + movedAmount;
        var oldPlaylistPosition = spin.playlistPosition;

        $scope.refreshProgramWithoutServer();

        Auth.moveSpin({ spinId: spin.id, newPlaylistPosition: newPlaylistPosition }, function (err, newProgram) {
          if (err) { return false; }
          $scope.playlist = newProgram.playlist;
        });
      },

      // accept a commentary or song from the catalog
      receive: function (event, ui) {
        var audioBlock = ui.item.sortable.model;
        var index = ui.item.sortable.dropindex;

        // grab the start time
        if (audioBlock._type === 'Song') {
          
          // create the new spin object
          var newSpin = { _audioBlock: audioBlock,
                          duration: audioBlock.duration,
                          durationOffset: 0,
                          playlistPosition: $scope.playlist[index+1].playlistPosition,
                          _id: 'addedSpin',
                        }

          // insert the new spin
          $scope.playlist.splice(index, 0, newSpin);

          // update playlistPositions
          for (var i=index+1;i<$scope.playlist.length;i++) {
            $scope.playlist[i].playlistPosition += 1;
          }

          $scope.refreshProgramWithoutServer();

          // notify server and refresh list
          Auth.insertSpin({ playlistPosition: newSpin.playlistPosition,
                            _audioBlock: newSpin._audioBlock._id,
                            _station: $scope.currentStation._id 
                          }, function (err, newProgram) {
            if (err) { return false; }
            $scope.playlist = newProgram.playlist;
          });
        } else if (audioBlock._type === 'Commentary')  {

          // prepare upload
          var commentary = new $scope.FileUploader.FileLikeObject(ui.item.sortable.model.blob);
          commentary.lastModifiedDate = new Date();
          
          // store info that can't be passed to uploader in $scope.mostRecentCommentary object
          $scope.mostRecentCommentary.blob = ui.item.sortable.model.blob;
          $scope.mostRecentCommentary.model = ui.item.sortable.model;
          commentary._id='addedCommentary';

          // grab the playlistPosition of the spin whose place the commentary is taking
          $scope.mostRecentCommentary.playlistPosition = $scope.playlist[ui.item.sortable.dropindex].playlistPosition;

          $scope.uploader.addToQueue([commentary]);
        }
      }
    };


    // ******************************************************************
    // *                catalog sortable list options                   *
    // ******************************************************************
    $scope.catalogList = {
      connectWith: '.stationList'
    }

    $scope.removeSpin = function (spin, index) {
      $scope.playlist.splice(index,1);
      $scope.refreshProgramWithoutServer();

      Auth.removeSpin(spin, function (err, newProgram) {
        if (err) return false;
        $scope.playlist = newProgram.playlist;
      })
    }

    // if there's not a  currentStation yet, wait for it
    if (!$scope.currentStation._id) {
      $timeout($scope.setPlaylist, 1000);
    } else {
      $scope.setPlaylist();
    }
  });