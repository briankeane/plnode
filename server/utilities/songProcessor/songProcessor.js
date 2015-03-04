var Song = require('../../api/song/song.model');
var taglib = require('taglib');

function SongProcessor() {
  var self = this;

  this.getTags = function (filepath, callback) {
    taglib.read(filepath, function (err, tag, audioProperties) {
      if (err) callback(err);
      
      // combine objects
      tag.duration = audioProperties.length * 1000;
      tag.bitrate = audioProperties.bitrate;
      tag.sampleRate = audioProperties.sampleRate;
      tag.channels = audioProperties.channels;

      console.log(audioProperties);
      console.log(tag);
      callback(null, tag);

    });
  };
}

module.exports = new SongProcessor();