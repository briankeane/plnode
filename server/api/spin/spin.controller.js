'use strict';

var _ = require('lodash');
var Spin = require('./spin.model');
var Helper = require('../../utilities/helpers/helper');
var Scheduler = require('../../utilities/scheduler/scheduler');

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

// moves a spin
exports.move = function(req,res) {
  Spin.getFullPlaylist(req.body.spin._station, function (err, beforePlaylist) {
    if (err) return res.send (500, err);

    var minPlaylistPosition = Math.min(req.body.spin.playlistPosition, req.body.newPlaylistPosition);
    var maxPlaylistPosition = Math.max(req.body.spin.playlistPosition, req.body.newPlaylistPosition);

    // set flag for moving forward or backwards
    var movingForward = false;
    if (req.body.spin.playlistPosition < req.body.newPlaylistPosition) {
      movingForward = true;
    }

    var spinsToUpdate = [];
    for (var i=0;i<beforePlaylist.length;i++) {
      // if it's the moved spin, set the newPlaylistPosition
      if (beforePlaylist[i]._id.equals(req.body.spin._id)) {
        beforePlaylist[i].playlistPosition = req.body.newPlaylistPosition;
        spinsToUpdate.push(beforePlaylist[i]);

      // ELSE IF it's within the range  
      } else if ((beforePlaylist[i].playlistPosition >= minPlaylistPosition) &&
                  (beforePlaylist[i].playlistPosition <= maxPlaylistPosition)) {
        if(movingForward) {
          beforePlaylist[i].playlistPosition = beforePlaylist[i].playlistPosition - 1;
        } else {
          beforePlaylist[i].playlistPosition = beforePlaylist[i].playlistPosition + 1;
        }
        spinsToUpdate.push(beforePlaylist[i]);
      }
    }

    Helper.saveAll(spinsToUpdate, function (err, updatedSpins) {
      if (err) return res.send(500, err);
      Scheduler.getProgram({ stationId: req.body.spin._station }, function (err, program) {
        program.oldProgram = beforePlaylist;
        return res.json(200, program);
      });
    });
  });
}

function handleError(res, err) {
  return res.send(500, err);
}