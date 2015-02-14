var ffmpeg = require('fluent-ffmpeg');
var path = require('path');

function AudioConverter() {
  var self = this;

  this.convertFile = function (filepath, callback) {
    var newFilepath = __dirname + '/../../data/processedAudio/' + path.basename(filepath)
    
    // fix the extension
    newFilepath = newFilepath.replace('.m4a','.mp3');
    newFilepath = newFilepath.replace('.wav', '.mp3');
    newFilepath = newFilepath.replace('.m4p', '.mp3');


    console.log('hi');
    console.log(newFilepath);

    ffmpeg(filepath)
    .audioCodec('libmp3lame')
    .output(newFilepath)
    .on('error', function (err) {
      if (err.message.substr('Operation not permitted')) {
        var error = new Error('File is CopyProtected');  
        callback(error, null)
      }
    })
    .on('end', function () {
      callback(null, newFilepath);
    })
    .outputOptions('-write_xing 0')
    .run();
  }
}

module.exports = new AudioConverter();