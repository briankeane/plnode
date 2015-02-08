'use strict';

var _ = require('lodash');
var Spin = require('./spin.model');

// Get list of spins
exports.index = function(req, res) {
  Spin.find(function (err, spins) {
    if(err) { return handleError(res, err); }
    return res.json(200, spins);
  });
};

// Get a single spin
exports.show = function(req, res) {
  Spin.findById(req.params.id, function (err, spin) {
    if(err) { return handleError(res, err); }
    if(!spin) { return res.send(404); }
    return res.json(spin);
  });
};

// Creates a new spin in the DB.
exports.create = function(req, res) {
  Spin.create(req.body, function(err, spin) {
    if(err) { return handleError(res, err); }
    return res.json(201, spin);
  });
};

// Updates an existing spin in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Spin.findById(req.params.id, function (err, spin) {
    if (err) { return handleError(res, err); }
    if(!spin) { return res.send(404); }
    var updated = _.merge(spin, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, spin);
    });
  });
};

// Deletes a spin from the DB.
exports.destroy = function(req, res) {
  Spin.findById(req.params.id, function (err, spin) {
    if(err) { return handleError(res, err); }
    if(!spin) { return res.send(404); }
    spin.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}