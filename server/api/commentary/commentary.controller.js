'use strict';

var _ = require('lodash');
var Commentary = require('./commentary.model');

// Get list of commentarys
exports.index = function(req, res) {
  Commentary.find(function (err, commentarys) {
    if(err) { return handleError(res, err); }
    return res.json(200, commentarys);
  });
};

// Get a single commentary
exports.show = function(req, res) {
  Commentary.findById(req.params.id, function (err, commentary) {
    if(err) { return handleError(res, err); }
    if(!commentary) { return res.send(404); }
    return res.json(commentary);
  });
};

// Creates a new commentary in the DB.
exports.create = function(req, res) {
  Commentary.create(req.body, function(err, commentary) {
    if(err) { return handleError(res, err); }
    return res.json(201, commentary);
  });
};

// Updates an existing commentary in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Commentary.findById(req.params.id, function (err, commentary) {
    if (err) { return handleError(res, err); }
    if(!commentary) { return res.send(404); }
    var updated = _.merge(commentary, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, commentary);
    });
  });
};

// Deletes a commentary from the DB.
exports.destroy = function(req, res) {
  Commentary.findById(req.params.id, function (err, commentary) {
    if(err) { return handleError(res, err); }
    if(!commentary) { return res.send(404); }
    commentary.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}