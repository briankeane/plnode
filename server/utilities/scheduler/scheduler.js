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
var Helper = require('../helpers/helper');
var Q = require('q');



function Scheduler() {
  var self = this;

  function createSampleArray(station, callback) {
    var sampleArray = [];
    RotationItem.findAllForStation(station.id, function (err, rotationItems) {
      for (var i=0;i<rotationItems.length;i++) {
        if (rotationItems[i].bin === 'active') {
          for(var j=0;j<rotationItems[i].weight; j++) {
            sampleArray.push(rotationItems[i]._song);
          }
        }
      }
      callback(null, sampleArray);
    });
  }

  this.generatePlaylist = function (attrs, callback) {
    var previousSpin;
    var recentlyPlayedSongs = [];
    var spins = [];
    var sampleArray;

    // unpack attrs
    var station = attrs.station


    // return if playlistEndTime is out of range
    if (attrs.playlistEndTime && (moment().add(1,'days').isBefore(moment(attrs.playlistEndTime)))) {
      attrs.playlistEndTime = moment().add(1,'days').toDate();
    }

    // create the endTime
    var playlistEndTime = attrs.playlistEndTime || new Date(new Date(attrs.playlistEndTime).getTime() + 2*60*60*1000);

    // grab the playlist and logs
    LogEntry.getRecent({ _station: station.id,
                         count: 30 }, function (err, currentLogEntries) {

      Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {

        // ** preload the recentlyPlayed list ***
        
        // go backwards through currentPlaylist
        for (var i=currentPlaylist.length-1;i>=0;i--) {
          if (currentPlaylist[i]._type === 'Song') {
            recentlyPlayedSongs.push(currentPlaylist[i]);
          }
          // if there's enough, break out
          if (recentlyPlayedSongs >= 20) {
            break;
          }
        }

        // if needed, go through log entries too
        for (var i=0;i<currentLogEntries; i++) {
          if (recentlyPlayedSongs.length >= 20) {
            break;
          }
          if (currentLogEntries[i]._audioBlock._type === 'Song') {
            recentlyPlayedSongs.push(currentLogEntries[i]._audioBlock);
          }
        }

        // create the sampleArray
        createSampleArray(station, function (err, createdSampleArray) {
          sampleArray = createdSampleArray;
          // Set previousSpin
          // IF LOG exists
          if (currentLogEntries.length) {
            // IF log but no playlist
            if (!currentPlaylist.length) {
              previousSpin = { playlistPosition: currentLogEntries[0].playlistPosition,
                                        airtime: currentLogEntries[0].airtime,
                                        _audioBlock: currentLogEntries[0]._audioBlock,
                                        _station: station,
                                      };
            } else { // (log and playlist exist) 
              previousSpin = currentPlaylist[currentPlaylist.length-1];
            }
          } else {  // (this is a new station)
            // create 1st spin and set it as the previous spin
            spins.push({ playlistPosition: 1,
                                  _audioBlock: chooseSong(),
                                  airtime: new Date(),
                                  _station: station,
                                  });
            previousSpin = spins[0];
          }

          // WHILE before playlistEndTime
          while (previousSpin.airtime < playlistEndTime) {
            // create the new spin
            var newSpin = { playlistPosition: previousSpin.playlistPosition + 1,
                            _audioBlock: chooseSong(),
                            _station: station,
                          };
            // add the airtime
            self.addScheduleTimeToSpin(station, previousSpin, newSpin);

            spins.push(newSpin);
            previousSpin = newSpin;
          
          } // ENDWHILE

          // Save the spins
          spinsToSave = _.map(spins, function(spin) { return new Spin(spin); });
          Helper.saveAll(spinsToSave, function (err, savedSpins) {

            // update and save the station
            station.lastAccuratePlaylistPosition = previousSpin.playlistPosition;
            station.lastAccurateAirtime = previousSpin.airtime;
            station.save(function (err, savedStation) {

              // if it's the first playlist, start the station
              if (currentLogEntries.length === 0) {
                var firstSpin = spins[0];
                var logEntry = new LogEntry({ _station: station.id,
                                              _audioBlock: firstSpin._audioBlock,
                                              playlistPosition: firstSpin.playlistPosition,
                                              airtime: firstSpin.airtime,
                                              durationOffset: firstSpin.durationOffset });
                logEntry.save(function (err, savedLogEntry) {
                  Spin.findById(firstSpin.id).remove(function (err, removedSpin) {
                    callback(null, station);
                    return;
                  });
                });
              } else {
                callback(null, station);
                return;
              }
            });
          });
        });
      });
    });

    // chooses a random song from the sampleArray
    function chooseSong() {
      song = _.sample(sampleArray);

      // while the id is in the recentlyPlayedSongs array, pick another
      while(recentlyPlayedSongs.some(function (e) { return e.id == song.id; })) {
        song = _.sample(sampleArray);
      }

      // adjust recentlyPlayedSongs
      recentlyPlayedSongs.push(song);
      if (recentlyPlayedSongs.length >= 20) {
        recentlyPlayedSongs.shift();
      }

      return song;
    }
  }

  this.oldGeneratePlaylist = function (attrs, callback) {
    // all times utc
    moment().utc().format();

    // format playlistEndTime
    if (attrs.playlistEndTime) {
      attrs.playlistEndTime = moment(attrs.playlistEndTime);
    }

    // unpack attrs
    var station = attrs.station;

    // return if playlistEndTime is out of range
    if (attrs.playlistEndTime && (moment().add(1,'days').isBefore(moment(attrs.playlistEndTime)))) {
      attrs.playlistEndTime = moment().add(1,'days').toDate();
    }
    

    var playlistEndTime = attrs.playlistEndTime || moment().add(2,'hours');
    
    
    // grab playlist and logs
    LogEntry.getRecent({ _station: station.id,
                         count: 20 }, function (err, currentLogEntries) {

      Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {

        // create the sample array to draw from
        sampleArray = [];
        RotationItem.findAllForStation(station.id, function (err, rotationItems) {
          rotationItems.forEach(function (rotationItem) {
            if (rotationItem.bin === 'active') {
              for(var i=0;i<rotationItem.weight; i++) {
                sampleArray.push(rotationItem._song);
              }
            }
          });

          // if the log exists but there's no playlist
          if ((!currentPlaylist.length) && (currentLogEntries.length)) {

            // give it 1 spin to start from
            song = _.sample(sampleArray);
            lastAccuratePlaylistPosition = currentLogEntries[0].playlistPosition + 1
            var spin = new Spin({ _station: station.id,
                                  _audioBlock: song,
                                  playlistPosition: lastAccuratePlaylistPosition,
                                  airtime: currentLogEntries[0].endTime });
            // repopulate _audioBlock
            spin._audioBlock = song;
            currentPlaylist.push(spin);
          }

          // set maxPosition and timeTracker values
          if (currentPlaylist.length == 0) {
            maxPosition = 0;
            timeTracker = moment();
          } else {
            var lastIndex = currentPlaylist.length - 1;
            maxPosition = currentPlaylist[lastIndex].playlistPosition;
            timeTracker = moment(currentPlaylist[lastIndex].endTime);
            
            if (currentPlaylist[lastIndex].commercialsFollow) {
              timeTracker.add(station.secsOfCommercialPerHour/2, 'seconds');
            }
          }

          // load recently played songs
          recentlyPlayedSongs = [];
          for (var i=0; i<currentPlaylist.length; i++) {
            recentlyPlayedSongs.push(currentPlaylist[i]._audioBlock);
          }

          // generate the playlist
          var spins = [];
          while(timeTracker.isBefore(playlistEndTime) || timeTracker.isSame(playlistEndTime)) {
            song = _.sample(sampleArray);

            // while the id is in the recentlyPlayedSongs array, pick another
            while(recentlyPlayedSongs.some(function (e) { return e.id == song.id; })) {
              song = _.sample(sampleArray);
            }

            recentlyPlayedSongs.push(song);

            // if recentlyPlayedSongs is at max size, delete the 1st song
            if ((recentlyPlayedSongs.length >= 20) || 
                                (recentlyPlayedSongs.length >= rotationItems.length-1)) {
              recentlyPlayedSongs.shift();
            }

            spin = new Spin({ _station: station.id,
                              _audioBlock: song,
                              playlistPosition: maxPosition += 1,
                              airtime: moment(timeTracker).toDate() });

            spins.push(spin);

            timeTracker = timeTracker.add(song.duration, 'ms');

           // TEMPORARY -- eventually change to "if spin.commercialsFollow" after all spins built out
           if (Math.floor(spin.airtime.getTime()/1800000.0) != Math.floor(timeTracker.toDate().getTime()/1800000.0)) {
            timeTracker = timeTracker.add(station.secsOfCommercialPerHour/2, 'seconds');
           }
          }

          Helper.saveAll(spins, function (err, savedSpins) {
            station.lastAccuratePlaylistPosition = maxPosition;
            station.lastAccurateAirtime = moment(timeTracker).toDate();
            station.save(function (err, savedStation) {
              // if it's the first playlist, start the station
              if (currentLogEntries.length === 0) {
                var firstSpin = spins[0];
                var logEntry = new LogEntry({ _station: station.id,
                                              _audioBlock: firstSpin._audioBlock,
                                              playlistPosition: firstSpin.playlistPosition,
                                              airtime: firstSpin.airtime,
                                              durationOffset: firstSpin.durationOffset });
                logEntry.save(function (err, savedLogEntry) {
                  Spin.findById(firstSpin.id).remove(function (err, removedSpin) {
                    callback(null, station);
                    return;
                  });
                });
              } else {
                callback(null, station);
                return;
              }
            });
          });
        });
      });
    });
  };

  this.addScheduleTimeToSpin = function (station, previousSpin, spinToSchedule) {
    // account for unmarked spins
    var previousSpinMarkups = {
      boo: previousSpin._audioBlock.boo || previousSpin._audioBlock.duration,
      eoi: previousSpin._audioBlock.eoi || 0,
      eom: previousSpin._audioBlock.eom || previousSpin._audioBlock.duration - 1000  // subtract a second to mash em up
    }

    var spinToScheduleMarkups = {
      boo: spinToSchedule._audioBlock.boo || spinToSchedule.duration,
      eoi: spinToSchedule._audioBlock.eoi || 0,
      eom: spinToSchedule._audioBlock.eom || spinToSchedule.duration - 1000
    }

    var previousSpinAirtimeInMS = new Date(previousSpin.airtime).getTime();
    var commercialBlockLengthMS = (station.secsOfCommercialPerHour/2)*1000;

    // IF previousSpin had commercials
    if (previousSpin.commercialsFollow) {
      // eom + commercialTime
      spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpinMarkups.eom + commercialBlockLengthMS);
    
    // ELSE IF previousSpin=Commentary
    } else if (previousSpin._audioBlock._type === 'Commentary') {
      
      // previousSpin=Commentary, spinToSchedule=Song
      if (spinToSchedule._audioBlock._type === 'Song') {
        
        // IF previousSpin Commentary is long enough to cover intro
        if ((previousSpin.duration - previousSpin.previousSpinOverlap) >= spinToScheduleMarkups.eoi) {
          // subtract the intro length from the start time
          spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpin.duration - spinToScheduleMarkups.eoi);
        } else {
          // schedule it at the end of the overlap
          spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpin.previousSpinOverlap);
        }
      
      // ELSE IF previousSpin=Commentary && spinToSchedule=commentary
      } else if (spinToSchedule._audioBlock._type === 'Commentary') {
        // regular schedule
        spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpin.duration);
        spinToSchedule.previousSpinOverlap = 0;
      }
    
    // ELSE IF previousSpin was a Song
    } else if (previousSpin._audioBlock._type === 'Song') {
      // IF previousSpin=song && spinToSchedule=Song
      if (spinToSchedule._audioBlock._type === 'Song') {
        console.log('song/song');
        console.log(previousSpinMarkups.eom);
        // start at EOM
        spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpinMarkups.eom);
      
      // ELSE IF spinToSchedule=Commentary && previousSpin=Song
      } else if (spinToSchedule._audioBlock._type === 'Commentary') {
        // IF it's long enough to cover outro
        if (spinToSchedule.duration > (previousSpin.duration - previousSpinMarkups.boo)) {
          // Subtract outro length
          spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpinMarkups.boo);
          spinToSchedule.previousSpinOverlap = previousSpin.duration - previousSpinMarkups.boo;
        // ELSE start new spin at previousSpin.eom
        } else {
          spinToSchedule.airtime = new Date(previousSpinAirtimeInMS + previousSpinMarkups.eom);
          spinToSchedule.previousSpinOverlap = previousSpin.duration - previousSpinMarkups.eom;
        }
      }
    }
  };



  this.updateAirtimes = function (attrs, callback) {

    moment().utc().format();

    var station = attrs.station;
    var fullPlaylist;
    var finalLogEntry;
    var playlist;
    var lastAccuratePlaylistPosition;
    var timeTracker;

    // exit if playlist is already accurate
    if ( ((attrs.endTime) && (attrs.endTime < station.lastAccurateAirtime)) || 
                                       ((attrs.playlistPosition) && 
                           (attrs.playlistPosition < lastAccuratePlaylistPosition))) {
      callback(null, station);
      return;
    }

    Spin.getFullPlaylist(station.id, function (err, gottenPlaylist) {
      fullPlaylist = gottenPlaylist;
      
      // exit if there's no playlist
      if (!fullPlaylist.length) {
        callback(null, station);
        return;
      }

      // if the lastAccuratePosition is after the log, set it as the starting point
      LogEntry.getRecent({ _station: station.id, count:1 }, function (err, gottenLogEntry) {
        finalLogEntry = gottenLogEntry[0];

        // if the lastAccuratePosition is in the playlist, use it to start
        if ((station.lastAccuratePlaylistPosition) && (station.lastAccuratePlaylistPosition > finalLogEntry.playlistPosition)) {
          lastAccuratePlaylistPosition = station.lastAccuratePlaylistPosition;
        
        // otherwise use logEntry
        } else {
          lastAccuratePlaylistPosition = finalLogEntry.playlistPosition;
        }
        Spin.getPartialPlaylist({ _station: station.id,
                                    startingPlaylistPosition: lastAccuratePlaylistPosition 
                                }, function (err, partialPlaylist) {
          
          playlist = partialPlaylist;

          // if starting with the log, set the timeTracker
          if (lastAccuratePlaylistPosition == finalLogEntry.playlistPosition) {
            timeTracker = moment(finalLogEntry.endTime);

            // add time for comemrcial block if necessary
            if (finalLogEntry.commercialsFollow) {
              timeTracker.add(station.secsOfCommercialPerHour/2, 'seconds');
            }

          // otherwise, set it to the beginning of the playlist
          } else {
            timeTracker = moment(playlist[0].airtime);
          }

          var toBeUpdated = [];
          var i=0;
          for (i=0; i<playlist.length; i++) {
            if (playlist[i].airtime.getTime() != timeTracker.toDate().getTime()) {
              playlist[i].airtime = moment(timeTracker).toDate();
              toBeUpdated.push(playlist[i]);
            }

            lastAccuratePlaylistPosition = playlist[i].playlistPosition;

            timeTracker.add(playlist[i].duration, 'ms');

            // add commercial time if necessary
            if (playlist[i].commercialsFollow) {
              timeTracker.add(station.secsOfCommercialPerHour/2, 'seconds');
            }

            // break out if past stop time
            if (attrs.endTime && (timeTracker > attrs.endTime)) {
              break;
            }

            // break out if past endingPlaylistPosition
            if (attrs.endingPlaylistPosition && (playlist[i].playlistPosition >= attrs.endingPlaylistPosition)) {
              break;
            }
          }

          // add 
          // var toSave = playlist.slice(0,i);
          toBeUpdated.push(station);

          // update
          Helper.saveAll(toBeUpdated, function (err, savedPlaylist) {
            callback(null, station);
            return;
          });
        });
      });
    });
  };

  this.bringCurrent = function (station, callback) {
    var logEntry;
    var playlist;
    var newLogEntries = [];

    LogEntry.getRecent({ _station: station.id, count: 1 }, function (err, logEntries) {
      
      // if there is no log or if the station is already current
      if (!logEntries.length || logEntries[0].endTime > new Date()) {
        callback(err, station);
        return;
      }
      
      logEntry = logEntries[0]

      // update airtimes through current time
      self.updateAirtimes({ station: station,
                            endTime: new Date() }, function (err, updatedStation) {
        station = updatedStation;
        
        // make sure the playlist lasts until now
        self.generatePlaylist({ station: station, endTime: Date.now() }, function (err, updatedStation) {
          station = updatedStation;

          Spin.getPartialPlaylist({ _station: station.id, 
                                    endTime: new Date()
                                     }, function (err, partialPlaylist) {

            playlist = partialPlaylist;

            var stationCommercialBlock = new CommercialBlock({ duration: (station.secsOfCommercialPerHour/2)*1000 });
            stationCommercialBlock.save(function (err, savedStationCommercialBlock) {
              stationCommercialBlock = savedStationCommercialBlock;

              Q.fcall(function () {
                if (logEntry.commercialsFollow) {
                  newLogEntry = new LogEntry({ playlistPosition: logEntry.playlistPosition,
                                               _audioBlock: stationCommercialBlock.id,
                                               _station: station.id,
                                               airtime: logEntry.endTime,
                                               commercialsFollow: false 
                                             }, function (err, newLogEntry) {
                    logEntry = newLogEntry;
                    return newLogEntry;
                  });
                }
                return logEntry;
                
              }).then(function (newLogEntry) {
                logEntry = newLogEntry;
                var playedLogEntries = [];
                
                playlist.forEach(function (spin) {
                  playedLogEntries.push(LogEntry.newFromSpin(spin));
                  
                  // if there's a commercial next and the commercial is not in the future
                  if (spin.commercialsFollow && (spin.endTime < new Date())) {
                    playedLogEntries.push( new LogEntry({ playlistPosition: spin.playlistPosition,
                                                          _audioBlock: stationCommercialBlock,
                                                          _station: station.id,
                                                          airtime: spin.endTime,
                                                          commercialsFollow: false }));
                  }
                });

                Helper.saveAll(playedLogEntries, function (err, savedLogEntries) {
                  Helper.removeAll(playlist, function (err, removedPlaylist) {
                    callback(null);
                    return null;
                  });
                });
              }).done();

            });
          });
        });
      });
    });
  }

  this.getProgram = function (attrs, callback) {
    Station.findById(attrs.stationId, function (err, station) {
      if (err) callback(err);
      if (!station) callback(new Error('Station not found'));

      // make sure schedule is accurate 2 hours from now
      self.bringCurrent(station, function () {
        self.updateAirtimes({ station: station,
                                    endTime: new Date(Date.now() + 60*60*2.5*1000) }, function (err, station) {
          self.generatePlaylist({ station: station,
                                      playlistEndTime: new Date(Date.now() + 60*60*2*1000) }, function (err, station) {
            Spin.getPartialPlaylist({ _station: station.id,
                                      endTime: new Date(Date.now() + 60*60*2*1000) }, function (err, playlist) {

              if(err) callback(err);
              LogEntry.getMostRecent(station.id, function (err, nowPlaying) {
                if (err) callback(err);

                // if a commercialBlock is in the playlist
                if (nowPlaying.commercialsFollow) {
                  
                  // create the new commercialBlock
                  var newCommercialBlock = {  _audioBlock: { 
                                                title: 'Commercial Block',
                                                _type: 'CommercialBlock',
                                                duration: station.secsOfCommercialPerHour/2*1000 
                                              },
                                              airtime: nowPlaying.endTime,
                                              endTime: playlist[0].airtime 
                                            };
                  
                  // if it's supposed to be nowPlaying insert it there
                  if (Date.now() > new Date(nowPlaying.endTime)) {
                    nowPlaying = newCommercialBlock;
                  
                  // if it's supposed to be first in the playlist
                  } else {
                    playlist.unshift(newCommercialBlock);
                  }
                }
                callback(null, {playlist: playlist, nowPlaying: nowPlaying});
              });
            });
          });
        });
      });
    });
  }

  this.getCommercialBlockLink = function (attrs, callback) {
    User.findById(attrs._user, function (err, user) {
      if (err) return (err);
      
      // find CommercialBlockNumber 
      var commercialBlockNumber = Math.floor(new Date(attrs.airtime).getTime()/1800000.0);

      // IF there's no lastCommercial, set it as a blank object
      if (!user.lastCommercial) {
        user.lastCommercial = { audioFileId: 0 };
      }

      
      // IF it's already been adjusted for this block
      if (user.lastCommercial && user.lastCommercial.commercialBlockNumber && (user.lastCommercial.commercialBlockNumber == commercialBlockNumber)) {
        callback(null, user.lastCommercial.audioFileUrl);
        return;
      } else {
        var newLastCommercial = {};
        newLastCommercial.commercialBlockNumber = commercialBlockNumber;
        
        if (user.lastCommercial.audioFileId === 27) {
          newLastCommercial.audioFileId = 1;
          newLastCommercial.audioFileUrl = 'http://commercialblocks.playola.fm/0001_commercial_block.mp3';
        } else {
          newLastCommercial.audioFileId = user.lastCommercial.audioFileId + 1;
        }

        // build link
        newLastCommercial.audioFileUrl = "http://commercialblocks.playola.fm/" + pad(newLastCommercial.audioFileId, 4) + "_commercial_block.mp3";

        User.findByIdAndUpdate(user.id, { lastCommercial: newLastCommercial }, function (err, newUser) {
          if (err) callback(err);
          callback(null, newLastCommercial.audioFileUrl);
        });
      }
    })
    
    // taken from StackOverflow: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
    function pad(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
  };

  // moves a spin
  this.moveSpin = function(attrs, callback) {
    Spin.findById(attrs.spinId, function (err, spin) {
      if (err) {
        callback(new Error('Spin not found'));
        return;
      }

      // throw an error if the same position is called for
      if (spin.playlistPosition == attrs.newPlaylistPosition) {
        callback (new Error('Spin is already at the requested playlistPosition'));
        return;
      }

      var minPlaylistPosition = Math.min(spin.playlistPosition, attrs.newPlaylistPosition);
      var maxPlaylistPosition = Math.max(spin.playlistPosition, attrs.newPlaylistPosition);

      var movingEarlier;
      if (minPlaylistPosition === attrs.newPlaylistPosition) {
        movingEarlier = true;
      }
      Spin.getFullPlaylist(spin._station, function (err, beforePlaylist) {
        if (err) callback(err);
      
        // find the relevant indexes
        var minIndex;
        var maxIndex;
        var oldIndex;
        var newIndex;

        for (i=0;i<beforePlaylist.length;i++) {
          if (beforePlaylist[i].playlistPosition === minPlaylistPosition) {
            minIndex = i;
          } else if (beforePlaylist[i].playlistPosition === maxPlaylistPosition) {
            maxIndex = i;
            break;
          }
        }

        // if the requested playlistPosition is too early,
        if (minIndex === 0) {
          callback(new Error('Invalid newPlaylistPosition -- airs too soon'));
          return;

        // or too late
        } else if (attrs.newPlaylistPosition > beforePlaylist[beforePlaylist.length-1].playlistPosition) {
          callback(new Error('Invalid newPlaylistPosition -- after end of playlist'));
          return;
        }

        // rearrange the array
        if (movingEarlier) {
          beforePlaylist.splice(minIndex, 0, beforePlaylist.splice(maxIndex, 1)[0]);
        } else {
          beforePlaylist.splice(maxIndex, 0, beforePlaylist.splice(minIndex, 1)[0]);
        }

        // step through the array and replace playlistPositions
        var playlistPositionTracker = beforePlaylist[minIndex-1].playlistPosition + 1
        var spinsToSave = [];

        for (var i=minIndex; i<=maxIndex; i++) {
          beforePlaylist[i].playlistPosition = playlistPositionTracker;
          playlistPositionTracker++;
          spinsToSave.push(beforePlaylist[i]);
        }
        
        Helper.saveAll(spinsToSave, function (err, updatedSpins) {  
          Station.findByIdAndUpdate(spin._station, { lastAccuratePlaylistPosition: minPlaylistPosition - 1 
                                                          }, function (err, updatedStation) {
            if (err) callback(err);
            self.updateAirtimes({ station: updatedStation, playlistPosition: maxPlaylistPosition + 1 }, function (err, updatedStation) {
              callback(null, { station: updatedStation,
                              updatedSpins: updatedSpins });
            });
          });
        });
      });
    });
  }

  this.removeSpin = function (spin, callback) {
    Spin.getPartialPlaylist({ startingPlaylistPosition: spin.playlistPosition + 1,
                              _station: spin._station
                            }, function (err, beforePlaylist) {
      if (err) return (err);

      var modelsToSave = [];
      var playlistPositionTracker = spin.playlistPosition + 1;
      for(var i=0; i<beforePlaylist.length;i++) {
        beforePlaylist[i].playlistPosition = beforePlaylist[i].playlistPosition - 1;
        modelsToSave.push(beforePlaylist[i]);
      }
      Station.findById(spin._station, function (err, station) {
        if (err) return (err);
        
        station.lastAccuratePlaylistPosition = spin.playlistPosition - 1;
        modelsToSave.push(station);

        Helper.saveAll(modelsToSave, function (err, savedSpins) {
          if (err) return (err);

          Spin.findByIdAndRemove(spin._id, function (err, removedSpin) {

            self.updateAirtimes({ station: station, playlistPosition: modelsToSave[0].playlistPosition 
                                }, function (err, updatedStation) {
              if (err) return err;

              callback(null, updatedStation);
            });
          });
        });
      });
    });
  };

  this.insertSpin = function (spinInfo, callback) {
    Spin.getPartialPlaylist({ startingPlaylistPosition: spinInfo.playlistPosition,
                              _station: spinInfo._station }, function (err, partialPlaylist) {
      if (err) return err;
      
      // update the rest of the playlist
      var modelsToSave = [];

      var playlistPositionTracker = partialPlaylist[0].playlistPosition + 1;
      for (var i=0;i<partialPlaylist.length;i++) {
        partialPlaylist[i].playlistPosition = playlistPositionTracker;
        modelsToSave.push(partialPlaylist[i]);
        playlistPositionTracker++;
      }

      // create the new spin
      var newSpin = new Spin({ _station: spinInfo._station,
                              _audioBlock: spinInfo._audioBlock,
                              playlistPosition: spinInfo.playlistPosition,
                              airtime: partialPlaylist[0].airtime });
      modelsToSave.push(newSpin);

      Station.findByIdAndUpdate(spinInfo._station, { lastAccurateAirtime: newSpin.airtime,
                                                     lastAccuratePlaylistPosition: newSpin.playlistPosition
                                                   }, function (err, updatedStation) {
        Helper.saveAll(modelsToSave, function (err, savedModels) {
          if (err) return err;
          callback(null, updatedStation);
        });
      });
    });
  };
}


module.exports = new Scheduler();