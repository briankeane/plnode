var fs = require('fs');
var child = require('child_process');
var app = require('../../app');
var request = require('supertest');
var SpecHelper = require('../helpers/specHelper');
var expect = require('chai').expect;
var converter = require('./audioConverter');
var taglib = require('taglib');

describe('AudioConverter', function (done) {
  var testFilesArray = [];
  before(function (done) {
    var finishedCount = 0;
    

    // copy the file from test folder to unprocessedAudio folder
    var read = fs.createReadStream(__dirname + '/../../data/testFiles/lonestar.m4a');
    var write = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/lonestar.m4a');
    testFilesArray.push(__dirname + '/../../data/unprocessedAudio/lonestar.m4a');
    read.pipe(write)
    .on('finish', function () {
      finishedOperation();
    });

    var read2 = fs.createReadStream(__dirname + '/../../data/testFiles/stepladder.wav')
    var write2 = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/stepladder.wav');
    testFilesArray.push(__dirname + '/../../data/unprocessedAudio/stepladder.wav');
    read2.pipe(write2)
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


    function finishedOperation () {
      finishedCount++;

      if (finishedCount >= 3) {
        done();
      }
    }
  });

  xit('converts an m4a file', function (done) {
    this.timeout(15000);

    converter.convertFile(__dirname + '/../../data/unprocessedAudio/lonestar.m4a', function (err, filepath) {
      if (err) { console.log(err); }
      expect(fs.existsSync(filepath)).to.equal(true);
      var tag = taglib.tagSync(filepath);
      console.log(tag);
      expect(tag.artist).to.equal('Delbert McClinton');
      expect(tag.album).to.equal('Room to Breathe');
      expect(tag.title).to.equal('Lone Star Blues');
      done();
    });
  });

  xit('converts a wav file', function (done) {
    this.timeout(15000);
    converter.convertFile(__dirname + '/../../data/unprocessedAudio/stepladder.wav', function (err, filepath) {
      console.log(filepath);
      if (err) { console.log(err); }
      var tag = taglib.tagSync(filepath);
      console.log(tag);
      console.log(tag)
      expect(tag.artist).to.equal('Rachel Loy');
      expect(tag.album).to.equal('Broken Machine');
      expect(tag.title).to.equal('Stepladder');
      done();
    });
  });

  xit('does not convert a protected file', function (done) {
    this.timeout(5000);
    converter.convertFile(__dirname + '/../../data/unprocessedAudio/downtown.m4p', function (err, filepath) {
      expect(err.message).to.equal('File is CopyProtected');
      done();
    });
  });

  after(function (done) {
    for (var i=0;i<testFilesArray.length;i++) {
      if (fs.exists(testFilesArray[i])) fs.unlinkSync(testFilesArray[i]);
    }
    done();
  });
});