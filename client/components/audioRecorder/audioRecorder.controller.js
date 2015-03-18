angular.module('pl2NodeYoApp')
  .controller('AudioRecorderCtrl', function ($scope, $location, Auth, $sce, FileUploader) {

    $scope.refreshProgramFromServer;      // filled with reference when needed
    $scope.FileUploader = FileUploader;
    $scope.uploader = new FileUploader({ url: 'api/v1/commentaries/upload',
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
        item._file = $scope.blobs[0].blob;
        item.formData.push({ duration: Math.round($scope.mostRecentCommentary.model.duration),
                            _station: Auth.getCurrentStation()._id,
                            playlistPosition: $scope.mostRecentCommentary.playlistPosition });

    };
    $scope.uploader.onCompleteItem = function (item) {
      $scope.refreshProgramFromServer();
    }

    $scope.stopDisabled = true;
    $scope.recordButtonDisabled = false;
    $scope.recordedCommentaryObject;
    $scope.recordings = [];
    $scope.blobs = [];

    $scope.startRecordingPressed = function () {
      startRecording();
      $scope.recordButtonDisabled = true;
      $scope.stopDisabled = false;
      $(document).trigger('recordingStarted');
    };

    $scope.stopRecordingPressed = function () {
      stopRecording();
      $(document).trigger('recordingStopped');
      $scope.stopDisabled = true;
    };

    $scope.recordingList = {
      dropped: function (event) {
        var commentary = new $scope.FileUploader.FileLikeObject(event.source.nodeScope.$modelValue.blob);
        commentary.lastModifiedDate = new Date();
        var targetPlaylistPosition = event.dest.nodesScope.$modelValue[event.dest.index + 1].playlistPosition;
        $scope.mostRecentCommentary = { fileLikeObject: commentary,
                                        model: event.source.nodeScope.$modelValue,
                                        playlistPosition: targetPlaylistPosition };
        $scope.uploader.addToQueue([commentary]);
        $scope.refreshProgramFromServer = event.dest.nodesScope.refreshProgramFromServer;
      }
    }


    var audio_context;
    var recorder;
    var recordButton = $('#startRecording');
    var stopButton = $('#stopRecording');
    var volumeMeter = $('#volumeMeter');
    var canvas = document.getElementById("volumeMeter");
    var ctx = canvas.getContext("2d");
    // debugger;
    console.log(ctx);


    function startUserMedia(stream) {
      var input = audio_context.createMediaStreamSource(stream);
      console.log('Media stream created.');

      // set up nodes
      volumeAnimateNode = audio_context.createScriptProcessor(2048, 1, 1);
      volumeAnimateNode.connect(audio_context.destination);
      volumeAnalyser = audio_context.createAnalyser();
      volumeAnalyser.smoothingTimeConstant = 0/3;
      volumeAnalyser.fftSize = 2048;

      input.connect(volumeAnalyser);
      volumeAnalyser.connect(volumeAnimateNode);



    // THE FOLLOWING 2 WERE GRABBED FROM: http://css.dzone.com/articles/exploring-html5-web-audio
      var bufferLength = volumeAnalyser.fftSize;
      var dataArray = new Uint8Array(bufferLength);

      ctx.clearRect(0,0, canvas.width, canvas.height);

      function draw() {
        var drawVisual = requestAnimationFrame(draw);
        volumeAnalyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = 'rgb(1000,1000,1000)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.beginPath();

        var sliceWidth = canvas.width * 1.0/bufferLength;
        var x = 0;

        for (var i=0; i<bufferLength; i++) {
          var v=dataArray[i]/128.0;
          var y = v*canvas.height/2;

          if (i===0) {
            ctx.moveTo(x,y);
          } else {
            ctx.lineTo(x,y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();

      }

      draw();










        // var array = new Uint8Array(volumeAnalyser.frequencyBinCount);
        // volumeAnalyser.getByteFrequencyData(array);
        // var average = getAverageVolume(array);

        // ctx.clearRect(0,0,300,100);
        // ctx.fillStyle="gradient";
        // ctx.fillRect(0,0, average*2, 100);


      function getAverageVolume(array) {
        var values = 0;
        var average;
        var length = array.length;

        for (var i=0; i < length; i++) {
          values += array[i];
        }

        average = values/length;
        return average;
      }



      //input.connect(audio_context.destination);
      //console.log('Input connected to audio context destination.');

      recorder = new Recorder(input);
      console.log('Recorder initialised.');
    }

    function startRecording(button) {

      // recorder
      recorder && recorder.record();
      console.log('Recording...');
    }

    function stopRecording(button) {
      recorder && recorder.stop();
      console.log('Stopped recording.');
      // create WAV download link using audio data blob
      createDownloadLink();
      recorder.clear();
    }

    function createDownloadLink() {
      recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        var li = $('#recording li');
        var au = document.createElement('audio');
        var hf = document.createElement('a');
        var recordingList = $('#recordings');
        var template = $('#recording li').html();

        // store the blob and it's info
        au.onloadeddata = function () {
          $scope.recordings.push({  _audioBlock: { 
                                      _type: 'Commentary',
                                      audioFileUrl: url, 
                                      duration: au.duration * 1000,
                                      airtime: null,
                                      title: 'Commentary'
                                    },
                                  blob: blob,
                                  url: $sce.trustAsResourceUrl(url),
                                  src: $sce.trustAsResourceUrl(au.src),
                                  duration: au.duration * 1000 });
          $scope.blobs.push({ _type: 'Commentary',
                                              blob: blob,
                                              url: $sce.trustAsResourceUrl(url),
                                              src: $sce.trustAsResourceUrl(au.src),
                                              duration: au.duration * 1000 });
          console.log($scope.recordings);
        }

        // add the element to the screen
        au.controls = true;
        au.src = url;
        hf.href = url;
        //hf.download = new Date().toISOString() + '.wav';
        // hf.innerHTML = hf.download;
        // li.append(au);
        // li.append(hf);
        // recordingList.append(template);

        // Possibly a better way to do this in the future?

      });
    }

    //window.onload = function init() {
      try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || 
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia ||
                                navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
      } catch (e) {
        alert('No web audio support in this browser! ' + e);
      }

      navigator.getUserMedia({audio: true}, function(stream) {

        console.log("This is running");
        startUserMedia(stream);

      }, function(e) {
        $scope.recordingEnabled = false;
        console.log('No live audio input: ' + e);
      });
    //};
  });