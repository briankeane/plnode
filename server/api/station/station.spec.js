//'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var User = require('../user/user.model');
var Song = require('../song/song.model');
var Station = require('../station/station.model');
var expect = require('chai').expect;
var async = require('async');
var SpecHelper = require('../../utilities/specHelper');


describe('GET /api/v1/stations', function() {

  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/v1/stations')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});

describe('a station', function () {
  var song;
  var user;
  var station;

  beforeEach(function (done) {
    SpecHelper.clearDatabase(function() {

      user = new User({ twitterHandle: 'BrianKeaneTunes',
                          twitterUID: '756',
                          email: 'lonesomewhistle@gmail.com',
                          birthYear: 1977,
                          gender: 'male',
                          profileImageUrl: 'http://badass.jpg' });

      station = new Station ({ _user: user.id,
                              timezone: 'US Central Time',
                               secsOfCommercialPerHour: 3 }) 


      SpecHelper.saveAll([user, station], function (err, objects) {
        done();
      });
    });
  });

  it ('is created', function (done) {
    expect(station.id).to.not.equal(null);
    expect(station.secsOfCommercialPerHour).to.equal(3);
    expect(station.timezone).to.equal('US Central Time');
    expect(station._user.equals(user._id)).to.equal(true);
    done();
  });

  it ('can be updated', function (done) {
    user2 = new User ({ twitterHandle: 'bla' });
    user2.save(function (err, savedUser) {
      Station.findByIdAndUpdate(station.id, { $set: { _user: user2.id, 
                                                    secsOfCommercialPerHour: 10,
                                                    lastAccuratePlaylistPosition: 1,
                                                    averageDailyListeners: 2,
                                                    timezone: 'UK Central Time',
                                                    averageDailyListenersCalculationDate: new Date(2014,1,1) } },
                                  function (err, updatedStation) {
        expect(updatedStation.secsOfCommercialPerHour).to.equal(10)
        expect(updatedStation._user.equals(user2.id)).to.equal(true);
        expect(updatedStation.timezone).to.equal('UK Central Time');
        expect(updatedStation.lastAccuratePlaylistPosition).to.equal(1);
        expect(updatedStation.averageDailyListeners).to.equal(2);
        expect(updatedStation.averageDailyListenersCalculationDate.getTime()).to.equal(new Date(2014,1,1).getTime());

        done();
      });
      
    })
  });

  xit ('returns a genre hash', function (done) {

  })

  describe ('make_log_current', function () {

    xit ('gets the average number of listeners', function (done) {

    });
  });
});