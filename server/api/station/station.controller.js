'use strict';

var _ = require('lodash');
var Station = require('./station.model');
//var SongPool = require('../../utilities/songPoolHandlerEmitter');
var RotationItem = require('../rotationItem/rotationItem.model');
var User = require('../user/user.model');
var SongPool = require('../../utilities/songPoolHandlerEmitter/songPoolHandlerEmitter');
var RotationItem = require('../rotationItem/rotationItem.model');

// Get list of stations
exports.index = function(req, res) {
  Station.find(function (err, stations) {
    if(err) { return handleError(res, err); }
    return res.json(200, stations);
  });
};

// Get a single station
exports.show = function(req, res) {
  Station.findById(req.params.id, function (err, station) {
    if(err) { return handleError(res, err); }
    if(!station) { return res.send(404); }
    return res.json(station);
  });
};

// Creates a new station in the DB.
exports.create = function(req, res) {
  User.findOne({ _id: req.body._user }, function (err, user) {
    if (err) { return res.json(500, err); }
    if (!user) {return res.json(404, { message: 'User not found' } ); }
    Station.create({ _user: req.body._user,
                  timezone: user.timezone }, function (err, station) {
      if (err) { 
        return res.json(500, err); 
      } else {
        SongPool.getSongSuggestions(req.body.artists, function (err, songSuggestions) {
          if (err) { return res.json(500, err); }
          console.log("song Suggestions length: " + songSuggestions.length);
          for (var i=0;i<songSuggestions.length;i++) {
            if (i<13) {
              RotationItem.create({ _song: songSuggestions[i]._id,
                                    _station: station._id,
                                    bin: 'activeRotation',
                                    weight: 27 });
            } else if (i<40) {
              RotationItem.create({ _song: songSuggestions[i]._id,
                                    _station: station._id,
                                    bin: 'activeRotation',
                                    weight: 17 });
            } else if (i<57) {
              RotationItem.create({ _song: songSuggestions[i]._id,
                                    _station: station._id,
                                    bin: 'activeRotation',
                                    weight: 17 });
            } else {
              // we don't need the rest
              break;
            }
          }

          user.update({ _station: station._id }, function (err, updatedUser) {
            if (err) { 
              return res.json(500, err) 
            } else {
              return res.json(201, station);
            }

          });

        });
      }
    });
  });
};

// Updates an existing station in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Station.findById(req.params.id, function (err, station) {
    if (err) { return handleError(res, err); }
    if(!station) { return res.send(404); }
    var updated = _.merge(station, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, station);
    });
  });
};

// Deletes a station from the DB.
exports.destroy = function(req, res) {
  Station.findById(req.params.id, function (err, station) {
    if(err) { return handleError(res, err); }
    if(!station) { return res.send(404); }
    station.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

exports.me = function(req, res, next) {
  var userId = req.user._id;
  Station.findOne({
    _user: userId
  }, function(err, station) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!station) return res.json(401);
    res.json(station);
  });
};

exports.getRotationItems = function(req, res, next) {
  RotationItem.findAllForStation(req.params.id, function (err, rotationItems) {
    if (err) return next(err);
    return res.json(rotationItems);
  })
};

function handleError(res, err) {
  return res.send(500, err);
}