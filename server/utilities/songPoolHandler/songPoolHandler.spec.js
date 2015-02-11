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
    SongPool.clearAllSongs(function () {

      expect(true).to.equal(true);
      done();
    });
  });

  xit('adds multiple songs to the song pool', function (done) {

  });

  xit('deletes a song from the song pool', function (done) {

  });

  xit('retrieves an array of all songs in the song pool', function (done) {

  });

  xit('clears all songs from the song pool', function (done) {

  });

  xit('can tell if a song is included in the pool', function (done) {

  });

});