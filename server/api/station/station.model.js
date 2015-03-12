'use strict';

var ListeningSession = require('../listeningSession/listeningSession.model');
var User = require('../user/user.model');
var Helper = require('../../utilities/helpers/helper');
var timestamps = require('mongoose-timestamp');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Q = require('q');

var StationSchema = new Schema({
  _user:                                  { type: Schema.ObjectId, ref: 'User'},
  secsOfCommercialPerHour:                { type: Number, default: 360        },
  lastAccuratePlaylistPosition:           { type: Number                      },
  lastAccurateAirtime:                    { type: Date                        },
  dailyListenTimeMS:                      { type: Number, default: 0          },
  timezone:                               { type: String                      },
  dailyListenTimeCalculationDate:           { type: Date, default: Date.now() }
});

// calculates amount of listening for station rank
StationSchema.statics.listByRank = function (attrs, callback) {
  Station.find({}, function (err, fullList) {
    var lastNightMidnightMs = new Date().setHours(0,0,0,0);
    var  getRankFunctions = [];

    
    for(var i=0;i<fullList.length;i++) {
      getRankFunctions.push((function(index) {

        // if it was calculated today, just use what's there
        var deferred = Q.defer();
        if (fullList[index].dailyListenTimeCalculationDate < lastNightMidnightMs) {
          return Q.fcall(fullList[index]);
        } else {
          new Date(lastNightMidnightMs - 24*60*60*1000)
          ListeningSession.find({ $and: [ 
                                    { _station: fullList[index]._id },
                                    { $or: [
                                      { startTime: { 
                                        $gte: new Date(lastNightMidnightMs - 24*60*60*1000),
                                        $lt: new Date(lastNightMidnightMs)
                                        }
                                      },
                                      { endTime: {
                                        $gte: new Date(lastNightMidnightMs - 24*60*60*1000),
                                        $lt: new Date(lastNightMidnightMs)
                                        }
                                      }
                                      ]
                                    }
                                  ] 
                                }, function (err, listeningSessions) {
            if (err) return deferred.reject(new Error(err));

            // sum the total ms of listening time
            var totalMS = 0;
            console.log(listeningSessions.length);

            for(var j=0;j<listeningSessions.length;j++) {
              var startTime = new Date(listeningSessions[j].startTime);
              var endTime = new Date(listeningSessions[j].endTime);

              // adjust for starting or ending out of 24-hr range
              if (startTime < new Date(lastNightMidnightMs - 24*60*60*1000)) {
                startTime = new Date(lastNightMidnightMs - 24*60*60*1000);
              }
              if (endTime > new Date(lastNightMidnightMs)) {
                endTime = new Date(lastNightMidnightMs);
              }

              var msInSession = endTime.getTime() - startTime.getTime();
              totalMS += msInSession;
            }

            // store the total
            fullList[index].dailyListenTimeCalculationDate = Date.now();
            fullList[index].dailyListenTimeMS = totalMS;

            fullList[index].save(function (err, station) {
              if (err) return deferred.reject(new Error(err));
              return deferred.resolve(station);
            });
          });
          return deferred.promise;
        }  //ENDIF
      })(i));
    }  // ENDFOR
    Q.all(getRankFunctions)
    .done(function (results) {
      console.log('done');

      Station
        .find({})
        .limit(30)
        .populate('_user')
        .sort('-dailyListenTimeMS')
        .exec(callback);
    });
  })
}

StationSchema.plugin(timestamps);
var Station = mongoose.model('Station', StationSchema);
module.exports = Station;