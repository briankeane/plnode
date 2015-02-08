var Station = require('../../api/station/station.model');
var AudioBlock = require('../../api/audioBlock/audioBlock.model');
var LogEntry = require('../../api/logEntry/logEntry.model');
var Commentary = require('../../api/commentary/commentary.model');
var RotationItem = require('../../api/rotationItem/rotationItem.model');
var CommercialBlock = require('../../api/commercialBlock/commercialBlock.model');
var Song = require('../../api/song/song.model');
var Spin = require('../../api/spin/spin.model');
var User = require('../../api/user/user.model');
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