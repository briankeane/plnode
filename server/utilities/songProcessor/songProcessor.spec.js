var SongProcessor = require('./songProcessor');
var expect = require('chai').expect;

describe('songProcessor', function (done) {
  
  it('gets id3 tags from an mp3 file', function (done) {
    this.timeout(5000);
    SongProcessor.getTags(process.cwd() + '/server/data/testFiles/look.mp3', function (err, tags) {
      console.log(tags);
      console.log(audioProperties)
      expect(tags.title).to.equal('Look At That Girl');
      expect(tags.artist).to.equal('Rachel Loy');
      expect()
      done();
    });
  });

  xit('gets id4 tags from an encrypted m4a file', function (done) {
    done();
  });

  xit('gets id4 tags from a non-encrypted m4a file', function (done) {
    done();
  });

  xit('writes the id3 tags to an mp3 file', function (done) {

  });

});