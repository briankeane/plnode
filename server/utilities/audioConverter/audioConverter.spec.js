var fs = require('fs');
var child = require('child_process');
var app = require('../../app');
var request = require('supertest');
var SpecHelper = require('../helpers/specHelper');
var expect = require('chai').expect;
var converter = require('./audioConverter');

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


    function finishedOperation () {
      finishedCount++;

      if (finishedCount >= 2) {
        done();
      }
    }
  });

  it('converts an m4a file', function (done) {
    this.timeout(15000);

    converter.convertFile(__dirname + '/../../data/unprocessedAudio/lonestar.m4a', function (err, filepath) {
      if (err) { console.log(err); }
      expect(fs.statSync(filepath)["size"]).to.equal(4529111);
      done();
    });
  });

  it('converts a wav file', function (done) {
    this.timeout(15000);
    converter.convertFile(__dirname + '/../../data/unprocessedAudio/stepladder.wav', function (err, filepath) {
      if (err) { console.log(err); }
      expect(fs.statSync(filepath)["size"]).to.equal(3555264);
      done();
    });
  });

  after(function (done) {
    for (var i=0;i<testFilesArray.length;i++) {
      fs.unlinkSync(testFilesArray[i]);
    }
    done();
  });
});