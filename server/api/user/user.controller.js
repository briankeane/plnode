'use strict';

var Preset = require('../preset/preset.model');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var TimezoneFinder = require('../../utilities/timezoneFinder/timezoneFinder');
var _ = require('lodash');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

exports.twitterFriends = function(req,res) {
  User.findById(req.params.id, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);

    // build the query
    var query = { $or: [] };
    for (var i=0;i<user.twitter.friends.length;i++) {
      query["$or"].push({ twitterHandle: user.twitter.friends[i].screen_name });
    }

    // if none are on playola, return blank array
    if (!query["$or"].length) {
      return res.json(200, { friends: [] });
    
    // otherwise grab the stations
    } else {
      User
      .find(query)
      .populate('_station')
      .exec(function (err, users) {
        return res.json(200, { friends: users });
      })
    }
  });
};

exports.follow = function (req, res) {
  var followerId = req.body._id;
  var followeeId = req.params.followeeId;

  // check for already following
  Preset.findOne({ _follower: followerId,
                _followee: followeeId 
              }, function (err, preset) {
    if (err) { return res.send(err); }
    
    // IF already following, just get the list of presets and send it with 200
    if (preset) { 
      Preset
      .find({ _follower: followerId })
      .populate('_followee')
      .exec(function (err, presets) {
        // sort the presets
        if (err) { return res.send(err); }
        return res.json(200, presets);
      });

    // otherwise, create the preset and return a new current preset list
    } else {
      Preset.create({ _follower: followerId,
                      _followee: followeeId
                    }, function (err, newPreset) {
        if (err) { return res.send(err); }
        Preset
        .find({ _follower: follwerId })
        .populate('_followee')
        .sort(_followee.twitterHandle)
        .exec(function (err, presets) {
          if (err) { return res.send(err); }
          return res.send(201, { presets: presets });
        });
      });
    } // endIF
  });
}

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  User.findById(req.params.id, function (err, user) {
    if (err) { return handleError(res, err); }
    if(!user) { return res.send(404); }
    var updated = _.merge(user, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, user);
    });
  });
};

exports.findByKeywords = function (req, res) {
  User.keywordSearch(req.query.searchString, function (err, searchResults) {
    if (err) { return res.send(500, err); }
    return res.json(200, { searchResults: searchResults });
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};
/**
 * Sets the zipcode
 */
exports.setZipcode = function(req, res, next) {
  var userId = req.user._id;
  TimezoneFinder.findByZip(req.body.zipcode, function (err, timezone) {
    if(err) { console.log(err); return res.send(422, { message: err.message }); }
    User.findById(userId, function (err, user) {
      if (err) { return res.json(400); }
      if(!user) { return res.send(404); }
      User.findByIdAndUpdate(userId, { zipcode: req.body.zipcode, timezone: timezone }, function (err, updatedUser) {
        if (err) { return err; }
        return res.json(200, updatedUser);
      });
    });
  });
};

exports.presets = function (req, res) {
  Preset
  .find({ follower: req.params._id })
  .populate('followee')
  .exec(function (err, presets) {
    if (err) { return res.send(500, err); }
    return res.json(200, { presets: presets })
  })
}


exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({ _id: userId })
  .select('-salt -hashedPassword')
  .populate('_station')
  .exec(function (err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

exports.search = function (req, res, next) {
  var keywordString = req.keywordString
  User.keywordSearch(req.keywordString, function (err, list) {
    if (err) return next(err);
    if (!list) return res.send(200, { users: [] });
    return res.json(200, { users: list });
  });
}

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
