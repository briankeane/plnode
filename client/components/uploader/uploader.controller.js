angular.module('pl2NodeYoApp')
  .controller('uploaderCtrl', function ($scope, Auth, FileUploader) {
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
          fileItem.ticket = response.ticket;
          fileItem.isSuccess = false;
          fileItem.isNeedInfo = true;
          fileItem.uploadId = response._id;
        }

      };
      $scope.uploader.onCompleteAll = function() {
          console.info('onCompleteAll');
      };

      console.info('uploader', uploader);



  });