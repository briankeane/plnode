'use strict';

var _ = require('lodash');
var Upload = require('./upload.model');
var SongProcessor = require('../../utilities/songProcessor/SongProcessor');

// Get list of things
exports.index = function(req, res) {
  Upload.find(function (err, things) {
    if(err) { return handleError(res, err); }
    return res.json(200, things);
  });
};

// Get a single thing
exports.show = function(req, res) {
  Upload.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    return res.json(thing);
  });
};

exports.create = function(req, res) {
  SongProcessor.addSongToSystem((process.cwd() + '/server/data/unprocessedAudio/' + req.files.file.name), function (err, newSong) {
    if (err) {
      if (err.message === 'Song info not found') {
        // get possible matches for response
        SongProcessor.getSongMatchPossibilities({ artist: err.tags.artist,
                                                  title: err.tags.title 
                                                }, function (matchErr, matches) {
          Upload.create({ tags: err.tags,
                          possibleMatches: matches,
                          filename: req.files.file.name,
                          status: 'info needed'
                        }, function (err, savedUpload) {
            return res.send(200, savedUpload);
          });
        })
      }
    } else {
      return res.send(200, { status: 'added',
                              song: newSong });
    }
  })
}

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Upload.findById(req.params.id, function (err, thing) {
    if (err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    var updated = _.merge(thing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, thing);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
  Upload.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}