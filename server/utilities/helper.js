var db = require('../db');
var Station = require('../models/station');
var audioBlockSchema = require('../models/audioBlockSchema');
var AudioBlock = db.model('AudioBlock', audioBlockSchema);
var LogEntry = require('../models/logEntry');
var Commentary = require('../models/commentary');
var RotationItem = require('../models/rotationItem');
var Song = require('../models/song');
var Spin = require('../models/spin');
var User = require('../models/user');
var moment = require('moment-timezone');
var _ = require('lodash');
var async = require('async')


function Helper() {  
  this.saveAll = function (objects, callback) {
    var functions = [];
    
    for (var i=0; i < objects.length; i++) {
      functions.push((function(obj) {
          return function(callback) {
              obj.save(callback);
          };
        })(objects[i]));
    }

    async.parallel(functions, function (err, results) {
      // format results
      results = _.map(results, function(result) { return result[0]; });
      callback(err, results);
    });
  };

  this.removeAll = function (objects, callback) {
    var functions = [];
    
    for (var i=0; i < objects.length; i++) {
      functions.push((function(obj) {
          return function(callback) {
              obj.remove(callback);
          };
        })(objects[i]));
    }

    async.parallel(functions, function (err, results) {
      // format results
      results = _.map(results, function(result) { return result[0]; });
      callback(err, results);
    });
  };
}

module.exports = new Helper();