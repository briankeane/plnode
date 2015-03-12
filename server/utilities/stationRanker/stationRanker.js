var ListeningSession = require('../../api/listeningSession/listeningSession.model')
var Station = require('../../api/station/station.model');

function stationRanker() {
  var self = this;

  this.setRankingScore(station, callback) {
    var lastNightMidnight = new Date().setHours(0,0,0,0);
    // if it was calculated today, just use what's stored
    if (station.dailyListenTimeCalculationDate.setHours(0,0,0,0) > lastNightMidnight) {
      callback(null, station.dailyListenTime);

      ListeningSession.find({ _station: station._id,
                            $or: [
                            { startTime: { 
                              $gte: new Date(lastNightMidnight - 24*60*60*1000),
                              $lt: lastNightMidnight
                              },
                              endTime: {
                                $gte: new Date(lastNightMidnight - 24*60*60*1000),
                                $lt: lastNightMidnight
                              }
                          }, function (err, listeningSessions) {
        
        // sum the total ms of listening time
        var totalMS = 0;
        for(var i=0;i<listeningSessions.length;i++) {
          var startTime = new Date(listeningSessions[i].startTime);
          var endTime = new Date(listeningSessions[i].endTime);

          // adjust for starting or ending out of 24-hr range
          if (startTime < new Date(lastNightMidnight - 24*60*60*1000)) {
            startTime = new Date(lastNightMidnight - 24*60*60*1000);
          }
          if (endTime > new Date(lastNightMidnight)) {
            endTime = new Date(lastNightMidnight);
          }

          var msInSesson = endTime.getTime() - startTime.getTime();
          totalMS += msInSession;
        }

        // store the total
        
      });  
    }
  }
}

module.exports = new StationRanker();