'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/v1/presets', function() {

  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/v1/presets')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });

  xit('follows someone', function (done) {
  });

  xit('does not duplicate a follow', function (done) {
  });

  xit('unfollows someone', function (done) {
  });
});