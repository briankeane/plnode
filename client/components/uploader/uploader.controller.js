angular.module('pl2NodeYoApp')
  .controller('uploaderCtrl', function ($scope, Auth, FileUploader, $modal) {
    $scope.uploader = new FileUploader({ url: 'api/v1/uploads',
                                          autoUpload: true });

      $scope.uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
          console.info('onWhenAddingFileFailed', item, filter, options);
      };
      $scope.uploader.onAfterAddingFile = function(fileItem) {
          console.info('onAfterAddingFile', fileItem);
      };
      $scope.uploader.onAfterAddingAll = function(addedFileItems) {
          console.info('onAfterAddingAll', addedFileItems);
      };
      $scope.uploader.onBeforeUploadItem = function(item) {
          console.info('onBeforeUploadItem', item);
      };
      $scope.uploader.onProgressItem = function(fileItem, progress) {
          console.info('onProgressItem', fileItem, progress);
      };
      $scope.uploader.onProgressAll = function(progress) {
          console.info('onProgressAll', progress);
      };
      $scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
          console.info('onSuccessItem', fileItem, response, status, headers);
      };
      $scope.uploader.onErrorItem = function(fileItem, response, status, headers) {
          console.info('onErrorItem', fileItem, response, status, headers);
      };
      $scope.uploader.onCancelItem = function(fileItem, response, status, headers) {
          console.info('onCancelItem', fileItem, response, status, headers);
      };
      $scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
        if (response.status === 'info needed') {
          fileItem.status = response.status;
          fileItem.possibleMatches = response.possibleMatches;
          fileItem.tags = response.tags;
          fileItem.filename = response.filename;
          fileItem.isSuccess = false;
          fileItem.isNeedInfo = true;
          fileItem.uploadId = response._id;
        } else if (response.status === 'added') {
          fileItem.status = response.status;
          fileItem.isSuccess = true;
          fileItem.songId = response.song._id;
        }

      };
      $scope.uploader.onCompleteAll = function() {
          console.info('onCompleteAll');
      };

      $scope.addToMyStation = function (songId) {
        Auth.createRotationItem({ weight: 17,
                                  bin: 'active',
                                  _song: songId }, function (err, results) {
          if (!err){
            for (var i=0;i<$scope.uploader.queue.length;i++) {
              if ($scope.uploader.queue[i].songId === songId) {
                $scope.uploader.queue[i].addedToStation = true;

              }
            }
          }
        });
      };

      $scope.getSongMatch = function (item) {
        $modal.open({
          templateUrl: 'components/uploader/getMatch.modal.html',
          size: 'lg',
          controller: function ($scope, $modalInstance) {
            scope: $scope,

            $scope.item = item;
            $scope.selectedSong = '';

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };

            $scope.submitSongWithEchonestId = function (form) {
              $scope.submitted = true;

              if (form.$valid) {
                if ($scope.selectedSong === 'ECHONESTIDNOTFOUND') {
                  // have user check spelling and resubmit


                // if echonestID was provided, resubmit upload
                } else {
                  var index = parseInt($scope.selectedSongIndex);
                  var uploadInfo = {
                                    match: item.possibleMatches[index],
                                    uploadId: item.uploadId,
                                    tags: item.tags
                                    };

                  Auth.resubmitUploadWithEchonestId(uploadInfo, function (err, result) {

                  });
                }
                alert('you chose ' + $scope.selectedSong);
              }
            };

          }
        });
      };

      console.info('uploader', uploader);
  });