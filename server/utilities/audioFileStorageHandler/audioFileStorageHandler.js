var config = require('../../config/environment');
var s3HighLevel = require('s3').createClient(config.s3Options);
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();
var _ = require('lodash');
var unidecode = require('unidecode');


function Handler() {
  var self = this;

  this.cleanFilename = function (filename) {
    var cleanedFilename = unidecode(filename)
                            .replace(/[^a-zA-Z0-9\-\.]/, '')
                            .replace('_', '-')
                            .replace(' ', '-');
    return cleanedFilename;
  }

  this.clearBucket = function (bucket, callback) {
    var listGetter = s3HighLevel.listObjects({ s3Params: { Bucket: bucket } });

    listGetter.on('data', function (data) {
      var objects = data.Contents;
      var objectKeys = [];

      
      if (objects.length > 0) {
        for(var i=0;i<objects.length;i++) {
          objectKeys.push({ Key: objects[i].Key });
        }

        var deleter = s3HighLevel.deleteObjects({ Bucket: bucket, Delete: { Objects: objectKeys } });
        deleter.on('end', function () {
          callback();
        })
      } else {
        callback ();
      }
    });
  }

  this.getStoredSongMetadata = function (key, callback) {
    var params = {
      Bucket: config["s3Buckets"].SONGS_BUCKET,
      Key: key
    };

    s3.headObject(params, function (err, data) {
      if (err) {
        callback(err, null);
      } else {
        var metadata = {
          title:      data.Metadata.pl_title,
          artist:     data.Metadata.pl_artist,
          album:      data.Metadata.pl_album,
          duration:   parseInt(data.Metadata.pl_duration, 10),
          echonestId: data.Metadata.pl_echonest_id
        }
        callback (null, metadata);
      }
    });
  }

  this.storeSong = function (attrs, callback) {
    // build key
    var listGetter = s3HighLevel.listObjects({ s3Params: { Bucket: config["s3Buckets"].SONGS_BUCKET } });

    listGetter.on('data', function (data) {
      var objects = data.Contents;
      var nextKeyValue;
      
      if (!objects.length) {
        nextKeyValue = 0;
      } else {
        objectKeyNumbers = _.map(objects, function (obj) { return parseInt(obj["Key"].substr(4,10)) });

        // grab the next available key value from the keys strings
        nextKeyValue = Math.max.apply(Math, objectKeyNumbers);
      }

      nextKeyValue++;

      var key = '-pl-' + 
                ('0' * (7 - nextKeyValue.toString())) + 
                nextKeyValue + '-' +
                attrs.artist + '-' + 
                attrs.title  +
                '.mp3';

      key = self.cleanFilename(key);
      var metadata = {
                        pl_artist: (attrs.artist || ''),
                        pl_title: (attrs.title || ''),
                        pl_duration: (attrs.duration.toString() || ''),
                        pl_album: (attrs.album || ''),
                        pl_echonest_id: (attrs.echonestId || '')
                      };

      var uploader = s3HighLevel.uploadFile({ localFile: attrs.filepath,
                                              s3Params: { 
                                                Bucket: config["s3Buckets"].SONGS_BUCKET,
                                                Key: key,
                                                ContentType: 'audio/mpeg',
                                                Metadata: metadata
                                              }
                                            });
      uploader.on('end', function (data) {
        callback(null, key);
      });
    });    
  };

  this.storeCommentary = function (attrs, callback) {
    // build key
    var listGetter = s3HighLevel.listObjects({ s3Params: { Bucket: config["s3Buckets"].COMMENTARIES_BUCKET } });

    listGetter.on('data', function (data) {
      var objects = data.Contents;
      var nextKeyValue;
      
      if (!objects.length) {
        nextKeyValue = 0;
      } else {
        objectKeyNumbers = _.map(objects, function (obj) { return parseInt(obj["Key"].substr(4,10)) });

        // grab the next available key value from the keys strings
        nextKeyValue = Math.max.apply(Math, objectKeyNumbers);
      }

      nextKeyValue++;

      var key = '-com' + 
                ('0' * (7 - nextKeyValue.toString())) + 
                nextKeyValue + '-' +
                attrs.stationId +
                '.mp3';

      key = self.cleanFilename(key);
      var metadata = {
                        pl_station_id: attrs.stationId,
                        pl_duration: (attrs.duration.toString() || ''),
                      };
                      console.log('localFile: ' + attrs.songFilepath);
      var uploader = s3HighLevel.uploadFile({ localFile: attrs.filepath,
                                              s3Params: { 
                                                Bucket: config["s3Buckets"].COMMENTARIES_BUCKET,
                                                Key: key,
                                                Metadata: metadata
                                              }
                                            });
      uploader.on('end', function (data) {
        callback(null, key);
      });
    });    
  };
  this.getUnprocessedSong = function (key, callback) {
    var filepath = process.cwd() + '/server/data/' + key
    var downloader = s3HighLevel.downloadFile({   localFile: filepath,
                                                  s3Params: { Bucket: config["s3Buckets"].UNPROCESSED_SONGS,
                                                               Key: key } });
    downloader.on('end', function () {
      console.log(filepath);
      callback(null, filepath);
    });
  }

  this.getAllSongs = function (callback) {

  }
}

module.exports = new Handler();