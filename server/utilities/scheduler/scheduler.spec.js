
var Station = require('../../api/station/station.model');
var AudioBlock = require('../../api/audioBlock/audioBlock.model');
var LogEntry = require('../../api/logEntry/logEntry.model');
var Commentary = require('../../api/commentary/commentary.model');
var RotationItem = require('../../api/rotationItem/rotationItem.model');
var Song = require('../../api/song/song.model');
var Spin = require('../../api/spin/spin.model');
var User = require('../../api/user/user.model');
var Scheduler = require('./scheduler');
var expect = require('chai').expect;
var SpecHelper = require('../helpers/specHelper');
var tk = require('timekeeper');
var _ = require('lodash');
var Helper = require('../helpers/helper');

describe('playlist functions', function (done) {
  var songs;
  var station;
  var user;
  var rotationItems;

  beforeEach(function (done) {
    SpecHelper.clearDatabase(function() {
      user = new User({ twitter: 'BrianKeaneTunes',
                        twitterUID: '756',
                        email: 'lonesomewhistle@gmail.com',
                        birthYear: 1977,
                        gender: 'male',
                        zipcode: '78748',
                        profileImageUrl: 'http://badass.jpg' });
      station = new Station({ _user: user.id,
                              secsOfCommercialPerHour: 360 });
      station.save(function (err, savedStation) {
        user._station = station.id;
        user.save(function (err, savedUser) {
          
          SpecHelper.loadSongs(86, function (err, songsArray) {
            songs = songsArray;
            
            rotationItems = [];
            for(var i=0;i<30;i++) {
              rotationItems.push(new RotationItem({ _song: songs[i].id,
                                                    _station: station.id,
                                                    bin: 'active',
                                                    weight: 45 }));
            }
            for(var i=30;i<45;i++) {
              rotationItems.push(new RotationItem({ _song: songs[i].id,
                                                    _station: station.id,
                                                    bin: 'active',
                                                    weight: 25 }));
            }
            for(var i=45;i<60;i++) {
              rotationItems.push(new RotationItem({ _song: songs[i].id,
                                                    _station: station.id,
                                                    bin: 'active',
                                                    weight: 10 }));
            }

            SpecHelper.saveAll(rotationItems, function (err, savedRotationItems) {
              rotationItems = savedRotationItems;
              tk.freeze(new Date(2014,3,15, 12,46));
              Scheduler.generatePlaylist({ station: station }, function (err, returnedStation) {
                tk.travel(new Date(2014,3,15, 12,46,01));
                done();
              });
            });
          });
        });
      });
    });
  });

  it('generatePlaylist creates a first playlist', function (done) {
    Spin.getFullPlaylist(station.id, function (err, spins) {
      LogEntry.getFullStationLog(station.id, function (err, logEntries) {
        // make sure all logEntry values stored
        expect(logEntries.length).to.equal(1);
        expect(logEntries[0].playlistPosition).to.equal(1);
        expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15, 12,46).getTime());
        expect(logEntries[0]._audioBlock.title).to.exist;
        expect(logEntries[0]._station).to.exist;
        expect(logEntries[0].durationOffset).to.equal(0);
        
        // make sure all spin values stored
        expect(spins.length).to.equal(36);
        expect(spins[0].playlistPosition).to.equal(2);
        expect(spins[0].airtime.getTime()).to.equal(new Date(2014,3,15, 12,49).getTime());
        expect(spins[0]._audioBlock.title).to.exist;
        expect(spins[0]._station).to.exist;
        expect(spins[0].durationOffset).to.equal(0);
  
        // make sure commercials are in the right place
        expect(spins[0].commercialsFollow).to.equal(false);
        expect(spins[3].commercialsFollow).to.equal(true);
        expect(spins[12].commercialsFollow).to.equal(true);
        expect(spins[21].commercialsFollow).to.equal(true);
        done();
      });
    });
  });
  
  it('updates the lastAccuratePlaylistPosition & lastAccurateAirtime', function (done) {
    Station.findById(station.id, function (err, foundStation) {
      expect(station.lastAccuratePlaylistPosition).to.equal(37);
      expect(foundStation.lastAccuratePlaylistPosition).to.equal(37);
      Spin.getByPlaylistPosition({ _station: station.id,
                                  playlistPosition: 37
                                }, function (err, foundSpin) {
        expect(station.lastAccurateAirtime.getTime()).to.equal(foundSpin.endTime.getTime());
        expect(foundStation.lastAccurateAirtime.getTime()).to.equal(foundSpin.endTime.getTime());
        done();
      });
    });
  });

  describe('updateAirtimes', function (done) {
    
    it('just returns if there is no playlist', function (done) {
      station2 = new Station({ secsOfCommercialPerHour: 30 });
      station2.save(function (err, savedNewStation) {
        Scheduler.updateAirtimes({ station: savedNewStation }, function (err, station2) {
          expect(err).to.equal(null);
          expect(station2.lastAccuratePlaylistPosition).to.be.an('undefined');
          done();
        });
      });
    });

    it('updates the airtimes', function (done) {
      Spin.getFullPlaylist(station.id, function (err, fullPlaylist) {
        // screw up some airtimes
        for (var i=10; i<fullPlaylist.length; i++) {
          fullPlaylist[i].airtime = new Date(1983,3,15);
        }

        station.lastAccuratePlaylistPosition = fullPlaylist[9].playlistPosition;
        station.lastAccurateAirtime = fullPlaylist[9].airtime;
        
        // group all objects to be saved and save them
        var toSave = fullPlaylist.slice(10,100);
        toSave.push(station);
        SpecHelper.saveAll(toSave, function (err, savedObjects) {
          // grab the updated station

          station = savedObjects[26];

          Scheduler.updateAirtimes({ station: station }, function (err, returnedStation) {
            Spin.getFullPlaylist(station.id, function (err, fixedPlaylist) {
              expect(fixedPlaylist[22].airtime.getTime()).to.equal(new Date(2014,3,15, 14,04).getTime());
              expect(fixedPlaylist[21].commercialsFollow).to.equal(true);
              expect(fixedPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
              expect(fixedPlaylist[10].airtime.getTime()).to.equal(new Date(2014,3,15, 13,22).getTime());
              expect(fixedPlaylist[11].airtime.getTime()).to.equal(new Date(2014,3,15, 13,25).getTime());
              done();
            });
          });
        });
      });
    });

    it('updates the airtimes if commercial leads in', function (done) {
      Spin.getFullPlaylist(station.id, function (err, fullPlaylist) {
        // screw up some airtimes -- starting with a commercialsFollow=true spin
        for (var i=5; i<fullPlaylist.length; i++) {
          fullPlaylist[i].airtime = new Date(1983,3,15);
        }

        station.lastAccuratePlaylistPosition = fullPlaylist[4].playlistPosition;
        station.lastAccurateAirtime = fullPlaylist[9].airtime;
        
        // group all objects to be saved and save them
        var toSave = fullPlaylist.slice(10,100);
        toSave.push(station);
        SpecHelper.saveAll(toSave, function (err, savedObjects) {
          // grab the updated station
          station = savedObjects[26];

          Scheduler.updateAirtimes({ station: station }, function (err, returnedStation) {
            Spin.getFullPlaylist(station.id, function (err, fixedPlaylist) {
              expect(fixedPlaylist[22].airtime.getTime()).to.equal(new Date(2014,3,15, 14,04).getTime());
              expect(fixedPlaylist[21].commercialsFollow).to.equal(true);
              expect(fixedPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
              expect(fixedPlaylist[4].airtime.getTime()).to.equal(new Date(2014,3,15, 13,04).getTime());
              expect(fixedPlaylist[5].airtime.getTime()).to.equal(new Date(2014,3,15, 13,07).getTime());
              done();
            });
          });
        });
      });
    });

    it('updates the airtimes if only the log is correct', function (done) {
      Spin.getFullPlaylist(station.id, function (err, fullPlaylist) {
        // screw up some airtimes -- starting with a commercialsFollow=true spin
        for (var i=0; i<fullPlaylist.length; i++) {
          fullPlaylist[i].airtime = new Date(1983,3,15);
        }

        station.lastAccuratePlaylistPosition = fullPlaylist[4].playlistPosition;
        station.lastAccurateAirtime = fullPlaylist[9].airtime;
        
        // group all objects to be saved and save them
        var toSave = fullPlaylist.slice(10,100);
        toSave.push(station);
        SpecHelper.saveAll(toSave, function (err, savedObjects) {
          // grab the updated station
          station = savedObjects[26];

          Scheduler.updateAirtimes({ station: station }, function (err, returnedStation) {
            Spin.getFullPlaylist(station.id, function (err, fixedPlaylist) {
              expect(fixedPlaylist[22].airtime.getTime()).to.equal(new Date(2014,3,15, 14,04).getTime());
              expect(fixedPlaylist[21].commercialsFollow).to.equal(true);
              expect(fixedPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
              expect(fixedPlaylist[4].airtime.getTime()).to.equal(new Date(2014,3,15, 13,04).getTime());
              expect(fixedPlaylist[5].airtime.getTime()).to.equal(new Date(2014,3,15, 13,07).getTime());
              done();
            });
          });
        });
      });
    });

  it('updates the airtimes starting from the log, commercialsFollow is true', function (done) {
      Spin.getFullPlaylist(station.id, function (err, fullPlaylist) {
        // screw up some airtimes -- starting with a commercialsFollow=true spin
        for (var i=0; i<fullPlaylist.length; i++) {
          fullPlaylist[i].airtime = new Date(1983,3,15);
        }

        LogEntry.getEntryByPlaylistPosition({ _station: station.id,
                                              playlistPosition: 1
                                            }, function (err, logEntry) {

          logEntry.airtime = new Date(2014,3,15, 12,58);
          logEntry.commercialsFollow = true;
          station.lastAccuratePlaylistPosition = logEntry.playlistPosition;
          station.lastAccurateAirtime = logEntry.airtime;
          
          // group all objects to be saved and save them
          var toSave = fullPlaylist.slice(10,100);
          toSave.push(station);
          toSave.push(logEntry);
          SpecHelper.saveAll(toSave, function (err, savedObjects) {
            // grab the updated station
            station = savedObjects[26];

            Scheduler.updateAirtimes({ station: station }, function (err, returnedStation) {
              Spin.getFullPlaylist(station.id, function (err, fixedPlaylist) {
                expect(fixedPlaylist[22].airtime.getTime()).to.equal(new Date(2014,3,15, 14,16).getTime());
                expect(fixedPlaylist[8].commercialsFollow).to.equal(true);
                expect(fixedPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,55).getTime());
                expect(fixedPlaylist[4].airtime.getTime()).to.equal(new Date(2014,3,15, 13,16).getTime());
                expect(fixedPlaylist[5].airtime.getTime()).to.equal(new Date(2014,3,15, 13,19).getTime());
                done();
              });
            });
          });
        });
      });
    });
  });
  
  it('does not extend the playlist past 24hrs', function (done) {
    Scheduler.generatePlaylist({ station: station,
                                playlistEndTime: new Date(2014,3,25, 16,46)
                              }, function (err, updatedStation) {
      Spin.getFullPlaylist(station.id, function (err, newPlaylist) {
        expect(newPlaylist.length).to.equal(432)
        expect(newPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
        expect(newPlaylist[35].airtime.getTime()).to.equal(new Date(2014,3,15, 14,46).getTime());
        done();
      })
    });
  });

  it('extends the playlist 4 hours', function (done) {
    Scheduler.generatePlaylist({ station: station,
                                playlistEndTime: new Date(2014,3,15, 16,46)
                              }, function (err, updatedStation) {
      Spin.getFullPlaylist(station.id, function (err, newPlaylist) {
        expect(newPlaylist.length).to.equal(72)
        expect(newPlaylist[71].airtime.getTime()).to.equal(new Date(2014,3,15, 16,46).getTime());
        expect(newPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
        expect(newPlaylist[35].airtime.getTime()).to.equal(new Date(2014,3,15, 14,46).getTime());
        done();
      });
    });
  });

  it('extends the playlist if a commercial leads in', function (done) {
    // remove enough for a commercialsFollow spin to be last
    Spin.find({ _station: station.id, playlistPosition: { $gte: 34 } }).remove().exec(function (err, removedSpins) {

      Scheduler.generatePlaylist({ station: station,
                                  playlistEndTime: new Date(2014,3,15, 16,46)
                                }, function (err, updatedStation) {
        Spin.getFullPlaylist(station.id, function (err, newPlaylist) {
          expect(newPlaylist.length).to.equal(72)
          expect(newPlaylist[71].airtime.getTime()).to.equal(new Date(2014,3,15, 16,46).getTime());
          expect(newPlaylist[34].airtime.getTime()).to.equal(new Date(2014,3,15, 14,43).getTime());
          expect(newPlaylist[35].airtime.getTime()).to.equal(new Date(2014,3,15, 14,46).getTime());
          done();
        });
      });
    });
  });

  it('brings the station current', function (done) {
    //tk.reset();
    tk.freeze(new Date(2014,3,15, 14,05));
    Scheduler.bringCurrent(station, function (err) {
      Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {
        LogEntry.getFullStationLog(station.id, function (err, logEntries) {
          
          expect(currentPlaylist[0].airtime.getTime()).to.equal(new Date(2014,3,15, 14,07).getTime());
          expect(currentPlaylist[0].playlistPosition).to.equal(25);
          expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15,14,04).getTime());
          expect(logEntries.length).to.equal(27);
          expect(logEntries[1]._audioBlock._type).to.equal('CommercialBlock');
          done();
        });
      }); 
    });
  });

  it('brings the station current if a spin with commercialsFollow=true leads in', function (done) {
    tk.freeze(new Date(2014,3,15, 14,30));
    Scheduler.bringCurrent(station, function (err) {
      tk.freeze(new Date(2014,3,15, 15,11));
      Scheduler.bringCurrent(station, function (err) {
        LogEntry.getFullStationLog(station.id, function (err, logEntries) {
          Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {
            expect(currentPlaylist[0].playlistPosition).to.equal(45);
            expect(currentPlaylist[0].airtime.getTime()).to.equal(new Date(2014,3,15, 15,13).getTime());
            expect(logEntries[0].playlistPosition).to.equal(44);
            expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15, 15,10).getTime());
            done();
          });
        });
      });
    });
  });

  it('brings the station current if a commercialBlock leads in', function (done) {
    tk.freeze(new Date(2014,3,15, 14,32));
    Scheduler.bringCurrent(station, function (err) {
      tk.freeze(new Date(2014,3,15, 15,11));
      Scheduler.bringCurrent(station, function (err) {
        LogEntry.getFullStationLog(station.id, function (err, logEntries) {
          Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {
            expect(currentPlaylist[0].playlistPosition).to.equal(45);
            expect(currentPlaylist[0].airtime.getTime()).to.equal(new Date(2014,3,15, 15,13).getTime());
            expect(logEntries[0].playlistPosition).to.equal(44);
            expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15, 15,10).getTime());
            done();
          });
        });
      });
    });
  });

  it('brings the station current if a commercialBlock should be nowPlaying', function (done) {
    tk.freeze(new Date(2014,3,15, 13,32));
    Scheduler.bringCurrent(station, function (err) {
      LogEntry.getFullStationLog(station.id, function (err, logEntries) {
        Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {
          expect(currentPlaylist[0].playlistPosition).to.equal(15);
          expect(currentPlaylist[0].airtime.getTime()).to.equal(new Date(2014,3,15, 13,34).getTime());
          expect(logEntries[0].playlistPosition).to.equal(14);
          expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15, 13,31).getTime());
          expect(logEntries[0]._audioBlock._type).to.equal('CommercialBlock');
          done();
        });
      });
    });
  });

  it('brings the station current if nowPlaying precedes a commercialBlock', function (done) {
    tk.freeze(new Date(2014,3,15, 13,30));
    Scheduler.bringCurrent(station, function (err) {
      LogEntry.getFullStationLog(station.id, function (err, logEntries) {
        Spin.getFullPlaylist(station.id, function (err, currentPlaylist) {
          var logMap = _.map(logEntries, function (spin) { return { playlistPosition: spin.playlistPosition,
                                                  airtime: spin.airtime } });
          var spinMap = _.map(currentPlaylist, function (spin) { return { playlistPosition: spin.playlistPosition,
                                                  airtime: spin.airtime } });

          expect(currentPlaylist[0].playlistPosition).to.equal(15);
          expect(currentPlaylist[0].airtime.getTime()).to.equal(new Date(2014,3,15, 13,34).getTime());
          expect(logEntries[0].playlistPosition).to.equal(14);
          expect(logEntries[0].airtime.getTime()).to.equal(new Date(2014,3,15, 13,28).getTime());
          expect(logEntries[0]._audioBlock._type).to.equal('Song');
          expect(logEntries[0].commercialsFollow).to.equal(true);

          done();
        });
      });
    });
  });

  xit('brings the station current if nowPlaying follows a commercialBlock', function (done) {

  });

  xit('getProgram gets a program', function (done) {

  });

  xit('moveSpin tests', function (done) {

  });

  xit('insertSpin tests', function (done) {

  });

  after(function (done) {
    tk.reset();
    done();
  });
});