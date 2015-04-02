'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var expect = require('chai').expect;
var Preset = require('./preset.model');
var User = require('../user/user.model');
var SpecHelper = require('../../utilities/helpers/specHelper');

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

  var users = [];
  var preset1;
  var preset2;

  beforeEach(function (done) {
    SpecHelper.clearDatabase(function() {
      users = [];

      users.push(new User({ twitterHandle: 'Bob' }))
      users.push(new User({ twitterHandle: 'Cindy' }))
      users.push(new User({ twitterHandle: 'SamJackson' }))
      users.push(new User({ twitterHandle: 'JohnTravolta' }))

      SpecHelper.saveAll(users, function (err, savedUsers) {
        preset1 = new Preset({ _follower: users[1]._id, _followee: users[0]._id });
        preset2 = new Preset({ _follower: users[2]._id, _followee: users[0]._id });

        SpecHelper.saveAll([preset1, preset2], function (err, savedPresets) {
          done();
        });
      });
    });
  });

  xit('follows someone', function (done) {

  });

  xit('does not duplicate a follow', function (done) {
  });

  xit('unfollows someone', function (done) {
  });

  it('returns a list of followers in order by twitterHandle', function (done) {
    Preset.getFollowers(users[0]._id, function (err, followers) {
      console.log(followers);
      console.log(users[0]._id);
      expect(followers.length).to.equal(2);
      expect(followers[0].twitterHandle).to.equal('Cindy');
      expect(followers[1].twitterHandle).to.equal('SamJackson');
      done();
    });
  })
});