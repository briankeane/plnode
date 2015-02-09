var config = require('../../config/environment');
var s3HighLevel = require('s3').createClient(config.s3Options);
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();


function Handler() {
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
}

module.exports = new Handler();