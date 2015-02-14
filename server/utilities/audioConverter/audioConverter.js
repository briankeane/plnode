var ffmpeg = require('fluent-ffmpeg');
var path = require('path');

function AudioConverter() {
  var self = this;

  this.convertFile = function (filepath, callback) {
    var newFilepath = __dirname + '/../../data/processedAudio/' + path.basename(filepath)
    newFilepath = newFilepath.replace('.m4a','.mp3');
    console.log('hi');
    console.log(newFilepath);

    ffmpeg(filepath)
    .audioCodec('libmp3lame')
    .output(newFilepath)
    .on('error', function (err) {
      callback(err, null)
    })
    .on('progress', function (progress) {
      console.log(progress.percent + '% done');
    })
    .on('end', function () {
      console.log('done');
      callback(null, newFilepath);
    })
    .outputOptions('-write_xing 0')
    .run();
  }
}

module.exports = new AudioConverter();