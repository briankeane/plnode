var SongProcessor = require('./songProcessor');
var expect = require('chai').expect;

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
      console.log(tags);
      expect(tags.title).to.equal('Lone Star Blues');
      expect(tags.artist).to.equal('Delbert McClinton');
      expect(tags.album).to.equal('Room to Breathe');
      done();
    });
  });

});