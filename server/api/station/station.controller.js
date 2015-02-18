'use strict';

var _ = require('lodash');
var Station = require('./station.model');

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
  Station.create(req.body, function(err, station) {
    if(err) { return handleError(res, err); }
    return res.json(201, station);
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

function handleError(res, err) {
  return res.send(500, err);
}