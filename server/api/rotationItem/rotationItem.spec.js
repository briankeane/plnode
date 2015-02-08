//'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var SpecHelper = require('../../utilities/helpers/specHelper');
var Song = require('../song/song.model');
var Station = require('../station/station.model');
var RotationItem = require('./rotationItem.model');
var expect = require('chai').expect;
var async = require('async');

describe('GET /api/v1/rotationItems', function() {

  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/v1/rotationItems')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});



describe('a rotationItem', function () {
  var rotationItem;
  var song;
  var station;

  beforeEach(function (done) {
    SpecHelper.clearDatabase(function() {
      song = new Song({ artist: 'Rachel Loy',
                        title: 'Stepladder',
                        album: 'Broken Machine',
                        duration: 180000,
                        key: 'ThisIsAKey.mp3',
                        echonestId: 'ECHONEST_ID' });

      station = new Station({ secsOfCommercialPerHour: 3 });
      
      SpecHelper.saveAll([song, station], function (err, moreResults) {
        rotationItem = new RotationItem({ _song: song._id,
                                          _station: station._id,
                                          bin: 'trash',
                                          weight: 45 });
        rotationItem.save(function (err) {
          done();
        }); 
      });
    });
  });

  it("stores a song's station, song, current weight and bin", function (done) {
    expect(rotationItem.bin).to.equal('trash');
    expect(rotationItem.weight).to.equal(45);
    //expect(rotationItem._station).to.equal(station.id);
    RotationItem.findByIdAndPopulate(rotationItem.id, function (err, item) {
      expect(item._song.title).to.equal('Stepladder');
      expect(item._song.id).to.equal(song.id);
      expect(item._station.id).to.equal(station.id);
      done();   
    });
  });

  it("can find all rotationItems for a station and populate them", function (done) {
    var newRotationItems = []
    var newStation = new Station({ secsOfCommercialPerHour: 10 });
    newStation.save(function (err, savedStation) {
      SpecHelper.loadSongs(10, function (err, loadedSongs) {
        for(var i=0;i<10;i++) {
          newRotationItems.push(new RotationItem({ _song: loadedSongs[i].id,
                                  _station: newStation.id,
                                  bin: 'test',
                                  weight: i }));
        }
        SpecHelper.saveAll(newRotationItems, function (err, savedRotationItems) {
          RotationItem.findAllForStation(newStation.id, function (err, foundRotationItems) {
            expect(foundRotationItems.length).to.equal(10);
            expect(foundRotationItems[0].weight).to.equal(9);
            expect(foundRotationItems[9].weight).to.equal(0);
            RotationItem.findAllForStation(station.id, function (err, otherFoundRotationItems) {
              expect(otherFoundRotationItems.length).to.equal(1);
              expect(otherFoundRotationItems[0]._song.title).to.equal('Stepladder');
              done();
            });
          });        
        });
      });
    });
  });

  it("can updated weight and log it's own history", function (done) {
    var oldDate = rotationItem.assignedAt;
    rotationItem.updateWeight(55, function (err, updatedItem) {
      expect(err).to.equal(null);
      expect(updatedItem.history[0].weight).to.equal(45);
      expect(updatedItem.weight).to.equal(55);
      expect(updatedItem.bin).to.equal('trash');
      expect(updatedItem.history[0].bin).to.equal('trash');
      expect(updatedItem.history[0].assignedAt.getTime()).to.equal(oldDate.getTime());
      expect(updatedItem.assignedAt.getTime()).to.be.above(oldDate.getTime());
      done();
    });
  });

  it("can update bin and log it's own history", function (done) {
    var oldDate = rotationItem.assignedAt;
    rotationItem.updateBin('recycle', function (err, updatedItem) {
      expect(updatedItem.weight).to.equal(45);
      expect(updatedItem.bin).to.equal('recycle');
      expect(updatedItem.history[0].weight).to.equal(45);
      expect(updatedItem.history[0].bin).to.equal('trash');
      expect(updatedItem.history[0].assignedAt.getTime()).to.equal(oldDate.getTime());
      expect(updatedItem.assignedAt.getTime()).to.be.above(oldDate.getTime());
      done();
    });
  });

  it("updates both bin and weight and logs it's own history", function (done) {
    var oldDate = rotationItem.assignedAt;
    rotationItem.updateWeightAndBin(55, 'recycle', function (err, updatedItem) {
      expect(updatedItem.weight).to.equal(55);
      expect(updatedItem.bin).to.equal('recycle');
      expect(updatedItem.history[0].bin).to.equal('trash');
      expect(updatedItem.history[0].weight).to.equal(45);
      expect(updatedItem.history[0].assignedAt.getTime()).to.equal(oldDate.getTime());
      expect(updatedItem.assignedAt.getTime()).to.be.above(oldDate.getTime());
      done();
    });
  });

  it("does not update if weight and bin are the same", function (done) {
    rotationItem.updateWeight(45, function (err, updatedItem) {
      expect(updatedItem.history.length).to.equal(0);
      rotationItem.updateBin('trash', function (err, updatedItem) {
        expect(updatedItem.history.length).to.equal(0);
        rotationItem.updateWeightAndBin(45,'trash', function (err, updatedItem) {
          expect(updatedItem.weight).to.equal(45);
          expect(updatedItem.bin).to.equal('trash');
          expect(updatedItem.history.length).to.equal(0);
          done();
        });
      });
    });
  });
});