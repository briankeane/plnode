var fs = require('fs');
var child = require('child_process');
var app = require('../../app');
var request = require('supertest');
var SpecHelper = require('../helpers/specHelper');
var expect = require('chai').expect;
var converter = require('./audioConverter');

describe('AudioConverter', function (done) {
  it('converts an audio file', function (done) {
    this.timeout(15000);

    var read = fs.createReadStream(__dirname + '/../../data/testFiles/lonestar.m4a')
    var write = fs.createWriteStream(__dirname + '/../../data/unprocessedAudio/lonestar.m4a')
    read.pipe(write)
    .on('finish', function () {
      console.log('file copied');
      converter.convertFile(__dirname + '/../../data/unprocessedAudio/lonestar.m4a', function (err, filepath) {
        console.log(err);
        done();
      });
    });
  });
});