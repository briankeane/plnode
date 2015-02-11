var SpecHelper = require('../helpers/specHelper');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var SongPool = require('./songPoolHandler');
var Song = require('../../api/song/song.model');
var expect = require('chai').expect;

describe('songPoolHandler', function (done) {

  var songs;
  
  before(function (done) { 
    this.timeout(10000);
    songs = [];
    songs.push(new Song({ artist: 'Rachel Loy',
                          title: 'Stepladder',
                          album: 'Broken Machine',
                          duration: 999,
                          key: 'test_key.mp3',
                          echonestId: 'SOOWAAV13CF6D1B3FA' }));
    songs.push(new Song({ artist: 'Rachel Loy',
                          title: 'Cheater',
                          album: 'Broken Machine',
                          duration: 888,
                          key: 'test_key2.mp3',
                          echonestId: 'SOTWSLV13CF6D275AF' }));
    SpecHelper.saveAll(songs, function (err, savedSongs) {
      SongPool.clearAllSongs(function () {
        done();
      });
    });
  });

  xit('adds a song to the song pool', function (done) {
    SongPool.clearAllSongs(function () {
      SongPool.addSong(songs[0], function (err) {
        SongPool.allSongs(function (err, allSongs) {
          expect(allSongs.length).to.equal(1);
          expect(allSongs[0].artist).to.equal('Rachel Loy');
          expect(allSongs[0].title).to.equal('Stepladder');
          expect(allSongs[0].album).to.equal('Broken Machine');
          expect(allSongs[0].duration).to.equal(999);
          expect(allSongs[0].key).to.equal('test_key.mp3');
          expect(allSongs[0].echonestId).to.equal('SOTWSLV13CF6D275AF');
          done();
        });
      });
    });
  });

  xit('adds multiple songs to the song pool', function (done) {

  });

  xit('deletes a song from the song pool', function (done) {

  });

  it('retrieves an array of all songs in the song pool', function (done) {
    SongPool.addSongs(songs, function (err, json) {
      var ticket = json.response["ticket"]
      console.log(ticket);

      function waitAndGetSongs(ticket) {
        echo('tasteprofile/status').get({ ticket: ticket }, function (err, json) {
          console.log(json.response);
          if (json.response["ticket_status"] != 'complete') {
            setTimeout(function (ticket) {
              waitAndGetSongs(ticket);
            }, 1000);
          } else {
            SongPool.getAllSongs(function (err, allSongs) {
              expect(allSongs.length).to.equal(2)
              console.log(allSongs[0]);
              expect(allSongs[0].title).to.equal(songs[0].title);
              expect(allSongs[1].title).to.equal(songs[1].title);
              done();
            });
          }
        });
      }

      waitAndGetSongs(ticket);

      // SongPool.getAllSongs(function (err, allSongs) {
      //   expect(allSongs.length).to.equal(2);
      //   done();
      // })
    });
  });

  xit('clears all songs from the song pool', function (done) {
    SongPool.addSongs(songs, function (err) {
      SongPool.allSongs(function (err, allSongs) {
        expect(allSongs.length).to.equal(2);
        SongPool.clearAllSongs(function (err) {
          SongPool.allSongs(function (err, allSongsWereDeleted) {
            expect(allSongsWereDeleted.lentgh).to.equal(0);
            done();
          });
        });
      });
    });
  });

  xit('test grabJson', function (done) {
    SongPool.grabJson(function (err, json) {
      console.log(json);
      console.log(json.response["catalog"]["items"]);
      done();
    });
  });


  xit('can tell if a song is included in the pool', function (done) {

  });

});