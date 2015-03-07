var SongProcessor = require('./songProcessor');
var expect = require('chai').expect;
var fs = require('fs');
var Song = require('../../api/song/song.model');
var Storage = require('../audioFileStorageHandler/audioFileStorageHandler');
var SongPool = require('../songPoolHandlerEmitter/songPoolHandlerEmitter');

describe('songProcessor', function (done) {
  
  it('gets id3 tags from an mp3 file', function (done) {
    this.timeout(5000);
    SongProcessor.getTags(process.cwd() + '/server/data/testFiles/look.mp3', function (err, tags) {
      expect(tags.title).to.equal('Look At That Girl');
      expect(tags.artist).to.equal('Rachel Loy');
      expect(tags.duration).to.equal(241000);
      expect(tags.sampleRate).to.equal(44100);
      expect(tags.channels).to.equal(2);
      expect(tags.bitrate).to.equal(160);
      expect(tags.album).to.equal('Broken Machine');
      done();
    });
  });

  it('gets id4 tags from an encrypted m4a file', function (done) {
    this.timeout(5000);
    SongProcessor.getTags(process.cwd() + '/server/data/testFiles/downtown.m4p', function (err, tags) {
      expect(tags.title).to.equal('Girl Downtown');
      expect(tags.artist).to.equal('Hayes Carll');
      expect(tags.album).to.equal('Trouble In Mind');
      expect(tags.duration).to.equal(207000);
      done();
    });
  });

  it('gets id4 tags from a non-encrypted m4a file', function (done) {
    this.timeout(5000);
    SongProcessor.getTags(process.cwd() + '/server/data/testFiles/lonestar.m4a', function (err, tags) {
      if (err) { console.log(err);}
      expect(tags.title).to.equal('Lone Star Blues');
      expect(tags.artist).to.equal('Delbert McClinton');
      expect(tags.album).to.equal('Room to Breathe');
      done();
    });
  });

  it('gets itunes info', function (done) {
    this.timeout(5000);
    SongProcessor.getItunesInfo({ artist: 'Miranda Lambert',
                                  title: 'Little Red Wagon'
                                }, function (err, match) {
      expect(match.albumArtworkUrl).to.equal('http://is1.mzstatic.com/image/pf/us/r30/Music/v4/e5/22/a0/e522a052-63eb-d71e-7fbd-ccff670a399d/886444518710.600x600-75.jpg');
      expect(match.trackViewUrl).to.equal('https://itunes.apple.com/us/album/little-red-wagon/id849069497?i=849069513&uo=4');
      done();
    });
  });

  it('getSongMatchPossibilities', function (done) {
    this.timeout(4000);
    SongProcessor.getSongMatchPossibilities({ artist: 'The Beatles',
                                              title: 'Eleanor Rigby' 
                                            }, function (err, matches) {
      expect(matches.length).to.equal(15);
      expect(matches[0].artist).to.equal('The Beatles');
      expect(matches[0].title).to.equal('ELEANOR RIGBY');
      expect(matches[0].echonestId).to.equal('SOKTZBX12B20E5E4AB');
      SongProcessor.getSongMatchPossibilities({ artist: 'Rachel Loy',
                                                title: 'Stepladder' 
                                              }, function (err, matches) {
        expect(matches[0].artist).to.equal('Rachel Loy');
        expect(matches[0].title).to.equal('Stepladder');
        done();
      });
    }); 
  });

  it('gets the echonest info', function (done) {
    SongProcessor.getEchonestInfo({ title: 'Stepladder', artist: 'Rachel Loy'
                                   }, function (err, song) {
      expect(song.title).to.equal('Stepladder');
      expect(song.artist).to.equal('Rachel Loy');
      expect(song.echonestId).to.equal('SOOWAAV13CF6D1B3FA');
      expect(song.genres.length).to.equal(0);
      SongProcessor.getEchonestInfo({ title: 'Kiss Me In The Dark',
                                      artist: 'Randy Rogers'
                                    }, function (err, song2) {
        expect(song2.title.toLowerCase()).to.equal('kiss me in the dark');
        expect(song2.artist).to.equal('Randy Rogers Band');
        expect(song2.genres[0]).to.equal('texas country');
        expect(song2.genres[1]).to.equal('outlaw country');
        done();
      });
    });
  });

  describe('adds a song to the system', function (done) {

    before(function (done) {
      this.timeout(5000);
      var finishedCount = 0;
      testFilesArray = [];
    
      // copy the file from test folder to unprocessedAudio folder
      var read = fs.createReadStream(__dirname + '/../../data/testFiles/lonestarTest.m4a');
      var write = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/lonestarTest.m4a');
      testFilesArray.push(__dirname + '/../../data/unprocessedAudio/lonestarTest.m4a');
      read.pipe(write)
      .on('finish', function () {
        finishedOperation();
      });

      // copy the file from test folder to unprocessedAudio folder
      var read = fs.createReadStream(process.cwd() + '/server/data/testFiles/lonestar.m4a');
      var write = fs.createWriteStream(process.cwd() + '/server/data/unprocessedAudio/lonestar.m4a');
      read.pipe(write)
      .on('finish', function () {
        finishedOperation();
      });

      var read3 = fs.createReadStream(__dirname + '/../../data/testFiles/downtown.m4p')
      var write3 = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/downtown.m4p');
      testFilesArray.push(__dirname + '/../../data/unprocessedAudio/downtown.m4p');
      read3.pipe(write3)
      .on('finish', function () {
        finishedOperation();
      });

      var read4 = fs.createReadStream(__dirname + '/../../data/testFiles/faith.mp3')
      var write4 = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/faith.mp3');
      testFilesArray.push(__dirname + '/../../data/unprocessedAudio/faith.mp3');
      read4.pipe(write4)
      .on('finish', function () {
        finishedOperation();
      });
      
      Storage.clearBucket('playolasongstest', function () {
        finishedOperation();
      });

      SongPool.clearAllSongs()
      .on('finish', function() {
        finishedOperation();
      });
      
      function finishedOperation() {
        finishedCount++;

        if (finishedCount >= 6) {
          done();
        }
      }
    });

    it('adds a song to the system (db, echonest, AWS', function (done) {
      this.timeout(40000);
      SongProcessor.addSongToSystem(process.cwd() + '/server/data/unprocessedAudio/lonestar.m4a', function (err, newSong) {
        if (err) console.log(err);
        Song.findOne({ artist: 'Delbert McClinton',
                    title: 'Lone Star Blues' }, function (err, song) {
          console.log(song);
          expect(song.title).to.equal('Lone Star Blues');
          expect(song.artist).to.equal('Delbert McClinton');
          expect(song.duration).to.equal(237000);
          expect(song.echonestId).to.equal('SOASHCW12B35058614');
          expect(song.key).to.equal('-pl-01-DelbertMcClinton-LoneStarBlues.mp3')
          expect(song.albumArtworkUrl).to.equal('http://is5.mzstatic.com/image/pf/us/r30/Music/v4/2b/fc/a3/2bfca30d-727c-e235-75d9-dbc7ead5b0d8/607396604234.600x600-75.jpg')
          expect(song.trackViewUrl).to.equal('https://itunes.apple.com/us/album/lone-star-blues/id508912066?i=508912363&uo=4');
          
          // make sure song was stored properly
          Storage.getStoredSongMetadata(song.key, function (err, data) {
            expect(data.title).to.equal(song.title);
            expect(data.artist).to.equal(song.artist);
            expect(data.duration).to.equal(song.duration);
            expect(data.echonestId).to.equal(song.echonestId);
          
            // make sure it was stored on echonest
            SongPool.getAllSongs()
            .on('finish', function (err, allSongs) {
              expect(allSongs[0].echonestId).to.equal(song.echonestId);
              done();
            });
          });
        })
      });
    });

    it('responds to no echonest song info', function (done) {
      SongProcessor.addSongToSystem(process.cwd() + '/server/data/unprocessedAudio/faith.mp3', function (err, newSong) {
        expect(err.message).to.equal('Song info not found');
        expect(err.tags.artist).to.equal('Sting');
        expect(err.tags.title).to.equal('Prologue (If I Ever Lose My Faith In You)');
        expect(err.tags.album).to.equal("Ten Summoner's Tales");
        done();
      });
    });

    it('responds to copy-protected song', function (done) {
      SongProcessor.addSongToSystem(process.cwd() + '/server/data/unprocessedAudio/downtown.m4p', function (err, newSong) {
        expect(err.message).to.equal('File is Copy-Protected');
        done();
      });
    });
    
    after(function (done) {
      this.timeout(5000);
      for (var i=0;i<testFilesArray.length;i++) {
        if (fs.exists(testFilesArray[i])) fs.unlinkSync(testFilesArray[i]);
      }

      Storage.clearBucket('playolasongstest', function () {
        SongPool.clearAllSongs()
        .on('finish', function() {
          done();
        });
      });
    });
  });
});