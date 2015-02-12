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

  it('adds a song to the song pool', function (done) {
    this.timeout(10000);
    SongPool.clearAllSongs(function () {
      SongPool.addSong(songs[0], function (err, ticket) {
        console.log(err);
        waitAndGetSongs(ticket, function (err, allSongs) {
          expect(allSongs.length).to.equal(1);
          expect(allSongs[0].artist).to.equal('Rachel Loy');
          expect(allSongs[0].title).to.equal('Stepladder');
          expect(allSongs[0].album).to.equal('Broken Machine');
          expect(allSongs[0].duration).to.equal(999);
          expect(allSongs[0].key).to.equal('test_key.mp3');
          expect(allSongs[0].echonestId).to.equal('SOOWAAV13CF6D1B3FA');
          done();
        });
      });
    });
  });

  it('deletes a song from the song pool', function (done) {
    this.timeout(5000);
    SongPool.addSongs(songs, function (err, ticket) {
      waitAndGetSongs(ticket, function (err, allSongs) {
        expect(allSongs.length).to.equal(2);
        SongPool.deleteSong(songs[0].key, function (err, ticket) {
          waitAndGetSongs(ticket, function (err, newAllSongs) {
            expect(newAllSongs.length).to.equal(1);
            expect(newAllSongs[0].title).to.equal('Cheater');
            done();
          })
        });
      });
    });
  });

  it('adds and retrieves an array of all songs in the song pool', function (done) {
    this.timeout(5000);
    SongPool.addSongs(songs, function (err, ticket) {
      waitAndGetSongs(ticket, function (err, allSongs) {
        expect(allSongs.length).to.equal(2)
        expect(allSongs[0].title).to.equal('Cheater');
        expect(allSongs[1].title).to.equal('Stepladder');
        done();
      });
    });
  });

  it('clears all songs from the song pool', function (done) {
  this.timeout(5000); 
    SongPool.addSongs(songs, function (err, ticket) {
      waitAndGetSongs(ticket, function (err, allSongs) {
        expect(allSongs.length).to.equal(2);
        SongPool.clearAllSongs(function (err, newTicket) {
          waitAndGetSongs(newTicket, function (err, allSongsWereDeleted) {
            expect(allSongsWereDeleted.length).to.equal(0);
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
      

function waitAndGetSongs(ticket, callback) {
  console.log("ticket: " + ticket);
  echo('tasteprofile/status').get({ ticket: ticket }, function (err, json) {
    if (json.response["ticket_status"] != 'complete') {
      setTimeout(function (ticket) {
        waitAndGetSongs(ticket, callback);
      }, 1000);
    } else {
      SongPool.getAllSongs(function (err, allSongs) {
        callback(err, allSongs);
      });
    }
  });
}