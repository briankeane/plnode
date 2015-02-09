var config = require('../../config/environment');
var s3HighLevel = require('s3').createClient(config.s3Options);
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var expect = require('chai').expect;

var audioSH = require('./audioFileStorageHandler');

describe('audioFileStorageHandler', function (done) {

  before(function (done) {  
    audioSH.clearBucket('playolasongstest', function () {
      audioSH.clearBucket('playolacommentariestest', function () {
        done();
      });
    });
  });

  after(function (done) {  
    audioSH.clearBucket('playolasongstest', function () {
      audioSH.clearBucket('playolacommentariestest', function () {
        done();
      });
    });
  });

  it('gets metadata from a stored song', function (done) {
    var uploader = s3HighLevel.uploadFile({ localFile: process.cwd() + '/server/data/testFiles/test.txt',
                                    s3Params: {
                                      Bucket: 'playolasongstest',
                                      Key: 'test.txt',
                                      Metadata: {
                                        pl_title       : "Stepladder",
                                        pl_artist      : "Rachel Loy",
                                        pl_album       : "Broken Machine",
                                        pl_duration    : "55",
                                        pl_echonest_id : 'SOOWAAV13CF6D1B3FA'
                                      }
                                    }
                                  });
    uploader.on('end', function () {
      audioSH.getStoredSongMetadata('test.txt', function (err, data) {
        expect(data.title).to.equal('Stepladder');
        expect(data.artist).to.equal('Rachel Loy');
        expect(data.album).to.equal('Broken Machine');
        expect(data.duration).to.equal(55);
        expect(data.echonestId).to.equal('SOOWAAV13CF6D1B3FA');
        done();
      });
    });
  });

  xit('stores a song', function (done) {

  });

  xit('stores a commentary', function (done) {

  });

  xit('updates the metadata on a song', function (done) {

  });

  xit('gets unprocessed song audio', function (done) {

  });

  xit('deletes unprocessed song', function (done) {

  });

  xit('returns an array of all stored songs as objects', function (done) {

  });

  xit('deletes a song', function (done) {

  });

  xit('checks to see if a song exists', function (done) {

  });

  xit('checks to see if an unprocessed song exists', function (done) {

  });
});