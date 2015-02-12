var config = require('../../config/environment');
var SpecHelper = require('../helpers/specHelper');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var SongPool = require('./songPoolHandler');
var Song = require('../../api/song/song.model');
var expect = require('chai').expect;
var fs = require('fs');
var _ = require('lodash');

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

  xit('deletes a song from the song pool', function (done) {
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

  xit('adds and retrieves an array of all songs in the song pool', function (done) {
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

  xit('clears all songs from the song pool', function (done) {
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

  describe('songPoolHandler - getSuggestions', function (done) {
    before(function (done) {
      this.timeout(5000);
      var data = fs.readFileSync(process.cwd() + '/server/data/testFiles/echonest_cat.json', 'utf8');
      SongPool.clearAllSongs(function (err, ticket) {
        echo('tasteprofile/update').post({ id: 'CAIQEUO1473A654C51', data: data }, function (err, json) {
          console.log(json);
          waitAndGetSongs(json.response["ticket"], function (err, allSongsAsObjects) {
            // seed the db
            var allSongs = _.map(allSongsAsObjects, function(attrs) { return new Song(attrs); });
              SpecHelper.saveAll(allSongs, function(err, songs) {
                console.log(songs.length);
                done();
            });
          });
        });
      });
    });

    it('suggests a playlist based on an artist', function (done) {
      this.timeout(5000);
      SongPool.getSongSuggestions(['Rachel Loy'], function (err, playlist) {
        expect(playlist.length > 30);
        expect(playlist[0].artist).to.be.a('String');
        expect(playlist[0].title).to.be.a('String');
        done();
      });
    });

    it('suggests a playlist based on multiple artists', function (done) {
      this.timeout(5000);
      SongPool.getSongSuggestions(['Rachel Loy', 'Lily Allen', 'Miranda Lambert'], function (err, playlist) {
        expect(playlist.length > 30).to.equal(true);
        expect(playlist[0].artist).to.be.a('String');
        expect(playlist[0].title).to.be.a('String');
        done();
      });
    });

    after(function (done) {
      SongPool.clearAllSongs(function (err, ticket) {
        done();
      });
    });
  });
});

function waitAndGetSongs(ticket, callback) {
  console.log("ticket: " + ticket);
  echo('tasteprofile/status').get({ ticket: ticket }, function (err, json) {
    if (json.response["ticket_status"] != 'complete') {
      console.log("ticket status: " + json.response["ticket_status"]);
      setTimeout(function () {
        waitAndGetSongs(ticket, callback);
      }, 1000);
    } else {
      SongPool.getAllSongs(function (err, allSongs) {
        callback(err, allSongs);
      });
    }
  });
}

function waitUntilFinished(ticket, callback) {
  console.log("ticket: " + ticket);
  echo('tasteprofile/status').get({ ticket: ticket }, function (err, json) {
    if (json.response["ticket_status"] != 'complete') {
      setTimeout(function () {
        waitUntilFinished(ticket, callback);
      }, 1000);
    } else {
      callback(err, allSongs);
    }
  });
}