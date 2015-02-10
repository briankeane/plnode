var config = require('../../config/environment');
var s3HighLevel = require('s3').createClient(config.s3Options);
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();
var expect = require('chai').expect;
var Station = require('../../api/station/station.model');
var fs = require('fs');
var audioSH = require('./audioFileStorageHandler');

describe('audioFileStorageHandler', function (done) {

  before(function (done) {  
    audioSH.clearBucket('playolasongstest', function () {
      audioSH.clearBucket('playolacommentariestest', function () {
        audioSH.clearBucket('playolaunprocessedsongstest', function () {
          done();
        });
      });
    });
  });

  afterEach(function (done) {  
    audioSH.clearBucket('playolasongstest', function () {
      audioSH.clearBucket('playolacommentariestest', function () {
        audioSH.clearBucket('playolaunprocessedsongstest', function () {
          done();
        });
      });
    });
  });

  xit('gets metadata from a stored song', function (done) {
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
    this.timeout(100000);
    audioSH.storeSong({ title: 'Look At That Girl',
                        artist: 'Rachel Loy',
                        album: 'Broken Machine',
                        duration: 9999,
                        echonestId: 'test_echonest_id',
                        filepath: process.cwd() + '/server/data/testFiles/look.mp3' 
                      }, function (err, key) {
      expect(err).to.equal(null);
      expect(key).to.be.a('string');
      s3.headObject({ Bucket: 'playolasongstest', Key: key}, function (err, data) {
        expect(data.ContentLength).to.equal('4961086');
        expect(data.Metadata.pl_title).to.equal('Look At That Girl');
        expect(data.Metadata.pl_artist).to.equal('Rachel Loy');
        expect(data.Metadata.pl_album).to.equal('Broken Machine');
        expect(data.Metadata.pl_duration).to.equal('9999');
        expect(data.Metadata.pl_echonest_id).to.equal('test_echonest_id');
        done();
      });
    });
  });

  xit('stores a commentary', function (done) {
    this.timeout(100000);
    station = new Station({ secsOfCommercialsPerHour: 360 });
    station.save(function (err, savedStation) {
      audioSH.storeCommentary({ stationId: station.id,
                                duration: 9999,
                                filepath: process.cwd() + '/server/data/testFiles/testCommentary.mp3' 
                              }, function (err, key) {
        expect(err).to.equal(null);
        expect(key).to.be.a('string');
        s3.headObject({ Bucket: 'playolacommentariestest', Key: key }, function (err, data) {
          expect(data.Metadata.pl_duration).to.equal('9999');
          expect(data.Metadata.pl_station_id).to.equal(station.id);
          expect(data.ContentLength).to.equal('497910');
          done();
        });
      });
    });
  });

  xit('updates the metadata on a song', function (done) {
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
      audioSH.updateStoredSongMetadata({ key: 'test.txt',
                                          title: 'FAKEtitle',
                                          artist: 'FAKEartist',
                                          album: 'FAKEalbum',
                                          duration: 1,
                                          echonestId: 'FAKEid'
                                        }, function (err) {
        s3.headObject({ Bucket: 'playolasongstest', Key: key}, function (err, data) {
          expect(data.ContentLength).to.equal('4961086');
          expect(data.Metadata.pl_title).to.equal('Look At That Girl');
          expect(data.Metadata.pl_artist).to.equal('Rachel Loy');
          expect(data.Metadata.pl_album).to.equal('Broken Machine');
          expect(data.Metadata.pl_duration).to.equal('9999');
          expect(data.Metadata.pl_echonest_id).to.equal('test_echonest_id');
          done();
        });
      });
    });
  });
  
  describe('fileFunctions', function (done) {
    after(function (done) {
      fs.unlink(process.cwd() + '/server/data/test.txt', function (err) {
        done();
      });
    });

    it('gets unprocessed song audio', function (done) {
      var uploader = s3HighLevel.uploadFile({ localFile: process.cwd() + '/server/data/testFiles/test.txt',
                                      s3Params: {
                                        Bucket: 'playolaunprocessedsongstest',
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
        audioSH.getUnprocessedSong('test.txt', function (err, filepath) {
          fs.stat(filepath, function (err, stats) {
            expect(stats.size).to.equal(14);
            done();
          });
        });
      });
    });
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