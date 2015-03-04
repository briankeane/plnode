var config = require('../../config/environment');
var SpecHelper = require('../helpers/specHelper');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var SongPool = require('./songPoolHandlerEmitter');
var Song = require('../../api/song/song.model');
var expect = require('chai').expect;
var fs = require('fs');
var _ = require('lodash');

// describe('rewriteTestThingy', function (done) {

//   it('rewrites the testSpec', function (done) {
    
//   }