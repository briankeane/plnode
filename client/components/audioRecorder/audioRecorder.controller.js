angular.module('pl2NodeYoApp')
  .controller('AudioRecorderCtrl', function ($scope, $location, Auth) {

    $scope.stopDisabled = true;
    $scope.recordButtonDisabled = false;
    $scope.recordedCommentaryObject;


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
      volumeAnalyser.fftSize = 1024;

      input.connect(volumeAnalyser);
      volumeAnalyser.connect(volumeAnimateNode);



      // THE FOLLOWING 2 WERE GRABBED FROM: http://css.dzone.com/articles/exploring-html5-web-audio
      volumeAnimateNode.onaudioprocess = function() {
        var array = new Uint8Array(volumeAnalyser.frequencyBinCount);
        volumeAnalyser.getByteFrequencyData(array);
        var average = getAverageVolume(array);

        ctx.clearRect(0,0,300,100);
        ctx.fillStyle="gradient";
        ctx.fillRect(0,0, average*2, 100);
      };

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
        var recordingList = $('#recording');
        var template = $('#recording li').html();

        // store the blob and it's info
        au.onloadeddata = function () {
          $scope.recordedCommentaryObject = { _type: 'Commentary',
                                              blob: blob,
                                              src: au.src,
                                              duration: au.duration * 1000 };
          console.log($scope.recordedCommentaryObject);
        }

        // add the element to the screen
        au.controls = true;
        au.src = url;
        hf.href = url;
        //hf.download = new Date().toISOString() + '.wav';
        hf.innerHTML = hf.download;
        li.append(au);
        li.append(hf);
        recordingList.append(template);

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