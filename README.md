# plNode

---------------------------
## Models

### User
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **twitterHandle**       | *String*                    | user's twitter handle           |
| **twitterUID**          | *String*                    | user's twitter user id          |
| **email**               | *String*                    | users email                     |
| **birthYear**           | *Number*                    | users birthyear                 |
| **gender**              | *String*                    | users gender                    |
| **zipcode**             | *String*                    | zipcode                         |
| **timezone**            | *String*                    | timezone of user                |
| **lastCommercial**      | *Number*                    | the number of the last commercial heard by this user |
| **twitter**             | *{}*                        | all info collected from twitter |
| **profileImageUrl**     | *String*                    | location of stored picture      |
| **_station**            | *reference to 'Station'*    | the user's station              |
######Virtual Properties:
| **profileImageUrl**     | *String*                    | full http link to profile image |
| **profileImageUrlSmall**| *String*                    | full link to small version      |
###### Statics:
```javascript
User.keywordSearch('Brian K', function (err, users) {
  // retrieves a list of users matching the keywords
});
```

### Station
| Property                                | Type                        | Description                                   |
| --------                                | :---:                       | :-------:                                     |
| **_user**                               | *reference to 'User'*       | its owning user                               |
| **secsOfCommercialPerHour**             | *Number*                    | secs of commercials per hour                  |
| **lastAccuratePlaylistPosition**        | *Number*                    | limit of station accuracy in playlistPositon  |
| **dailyListenTimeMS**                   | *Number*                    | average of how many listeners per day         |
| **dailyListenTimeCalculationDate**      | *Date*                      | calculation date of dailyListenTimeMS         |
| **timezone**                            | *String*                    | for proper station time display               |
| **commentaryCounter**                   | *Number*                    | for creating commentary keys                  |
###### Statics:
```javascript
Station.listByRank({}, function (list) {
  // returns a list of the top 30 ranking stations in order of listenership
});
```

#### AudioBlock (parent for Songs and Commentaries)
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **type**                | *String*                    | 'song' or 'commentary'          |
| **key**                 | *String*                    | storage key for audio file      |
| **duration**            | *Number*                    | in ms                           |

#### Commentary (inherit from audioBlock)
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **key**                 | *String*                    | storage key for audio file      |
| **duration**            | *Number*                    | in ms                           |
| **_station**            | *reference to 'Station'*    | its owning station              |
######Virtual Properties:
| **audioFileUrl**        | *link*                      | full http link to file          |

#### CommercialBlock (inherit from audioBlock)
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **duration**            | *Number*                    | in ms                           |

#### ListeningSession
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| startTime               | *Date*                      | start of session                |
| endTime                 | *Date*                      | end of session                  |
| _user                   | * reference to 'User'*      | user that is listening          |
| _station                | * reference to 'Station'*   | station that is being listened to |

#### Upload
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| filename                | *String*                    | filename                        |
| tags                    | *{}*                        | song tags                       |
| possibleMatches         | *[{}]*                      | possible matches for song       |
| status                  | *String*                    | processing status               |

#### Song (inherit from audioBlock)
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **key**                 | *String*                    | storage key for audio file      |
| **duration**            | *Number*                    | length of song in ms            |
| **artist**              | *String*                    | artist                          |
| **title**               | *String*                    | title                           |
| **album**               | *String*                    | album                           |
| **echonestId**          | *String*                    | song's id on echonest if found  |
| **albumArtworkUrl**     | *String*                    | location of album artwork file  |
| **trackViewUrl**        | *String*                    | link to iTunes purchase page    |
| **albumArtworkUrlSmall  | *String*                    | location of small album artwork |
| **eoi**                 | *Number*                    | end of intro in ms              |
| **eom**                 | *Number*                    | end of message in ms            |
| **boo**                 | *Number*                    | boo in ms                       |
| itunesInfo              | *{}*                        | all downloaded itunes info      |
######Virtual Properties:
| **audioFileUrl**        | *link*                      | full http link to file          |

###### Statics:
```javascript
Song.findAllMatchingTitle('Test', function (err, songArray){
  // songs matching title
}); 

Song.findAllMatchingArtist('Bob', function (err, songArray){
  // all matching artist ('Bob' and 'Bobby' would both be inlcuded)
}); 

Song.keywordSearch('Test This out', function (err, songArray){
  // array of songs where title or artist contain keywords
}); 

Song.findAllByTitleAndArtist({ artist: 'Randy Rogers Band',
                               title: 'One More Goodbye' }, function (err, songArray){
  // array of matching Songs
}); 

Song.all(function (err, songArray) {
  // all Songs ordered by title, artist
});
```
#### LogEntry
| Property                | Type                        | Description                             |
| --------                | :---:                       | :-------:                               |
| **playlistPosition**    | *Number*                    | position in playlist order              |
| **_audioBlock**         | *reference to 'AudioBlock'* | the song or commentary that was played  |
| **_station**            | *reference to 'Station'*    | its owning staton                       |
| **airtime**             | *Date*                      | time that it aired                      |
| **listenersAtStart**    | *Number*                    | number of listeners at start            |
| **listenersAtFinish**   | *Number*                    | number of listeners at end              |
| **durationOffset**      | *Number, default: 0*        | offset of spin in + or - ms             |
| **commercialsFollow**   | *Boolean*                   | did commercials follow the spin         |
######Virtual Properties:
| Property                | Type                        | Description                             |
| --------                | :---:                       | :-------:                               |
| **endTime**             | *Date*                      | airtime + duration                      |
| **duration**            | *Number (in ms)*            | _audioBlock.duration + durationOffset   |

###### Statics:
```javascript
LogEntry.getRecent({ _station: station.id,
                      count: 5  // default count is 1000
                    }, function (err, logEntryArray) {
  // logEntries starting with most recent
});

LogEntry.getMostRecent(stationId, function (err, mostRecentLogEntry) {
  the single most recent entry
});

LogEntry.getFullStationLog(station.id, function (err, logEntryArray) {
  // logEntries starting with most recent
});

LogEntry.getLog({ _station: station.id,
                  startTime: new Date(1983,3,15, 12,30),
                  endTime: new Date(1983,3,15, 12,45) 
                }, function (err, logEntryArray) {
  // logEntries starting with most recent
});

LogEntry.getLog({ _station: station.id,
                  startingPlaylistPosition: 22,
                  endingPlaylistPosition: 25 
                }, function (err, logEntryArray) {
  // logEntries starting with most recent
});

LogEntry.getLog({ _station: station.id,
                  startingDate: new Date(1983,3,14),
                  endingDate: new Date(1983,3,15) 
                }, function (err, logEntryArray) {
  // logEntries starting with most recent (midnight to midnight)
});

LogEntry.getEntryByPlaylistPosition({ _station: station.id,
                                      playlistPosition: 14
                                    }, function (err, logEntry) {
  // logEntry
});

var newLogEntry = LogEntry.newFromSpin(spin);  // returns a logEntry created from the spin
```
#### Spin
| Property              | Type                        | Description                                     |
| --------              | :---:                       | :-------:                                       |
| **playlistPosition**  |*Number*                     | current position in playlist order              |
| **_audioBlock**       |*reference to 'AudioBlock'*  | contains its song or commentary                 |
| **_station**          |*reference to 'Station'*     | its owning station                              |
| **airtime**           |*Date*                       | the currently scheduled airtime                 |
| **durationOffset**    |*Number, default: 0*         | positive or negative. allows blending of songs  |
| **manualDuration**    |*Number*                     | overrides duration if set                       |
| **manualEndTime       |*Number*                     | overrides endTime if set                        |
| **previousSpinOverlap |*Number*                     | for Commentary spins                            |
######Virtual Properties:
| Property              | Type                        | Description                           |
| --------              | :---:                       | :-------:                             |
| **commercialsFollow** | *Boolean*                   | calculated by airtime                 |
| **endTime**           | *Date*                      | airtime + duration                    |
| **duration**          | *Number (in ms)*            | _audioBlock.duration + durationOffset |

###### Statics:
```javascript
Spin.getFullPlaylist(station.id, function (err, spins) {
  // array of spins in chronological order
});

Spin.getPartialPlaylist({ _station: station.id,
                          endTime: new Date(1983,3,15, 12,30),  // and/or
                          startTime: new Date(1983,3,14, 12,30)
                        }, function (err spins) {
  // array of spins in chronological order
});

Spin.getPartialPlaylist({ _station: station.id,
                          endingPlaylistPosition: 12,  // and/or
                          startingPlaylistPosition: 20
                        }, function (err spins) {
  // array of spins in chronological order
});

Spin.getByPlaylistPosition({ _station: station.id,
                                  playlistPosition: 10
                                }, function (err, foundSpin) {
  // foundSpin
});
```
#### RotationItem
| Property        | Type                                                  | Description                       |
| --------        | :---:                                                 |:-------:                          |
| **_station**    |  *reference to 'Station'*                             | its owning station                |
| **_song**       | *reference to 'Song'*                                 | contains its song                 |
| **bin**         |  *String*                                             | 'inRotation', 'flashback'         |
| **weight**      | *Number*                                              | likely spins per week             |
| **assignedAt**  | *Date*                                                | date of current configuration     |
| **history**     |*[{ bin: String, weight: Number, assignedAt: Date }]*  | all past changes for this item    |

###### Statics:
```javascript
RotationItem.findByIdAndPopulate(rotationItemId, function (err, rotationItem) {
  // populated rotationItem
});

RotationItem.findAllForStation(stationId, function (err, rotationItems) {
  // array of rotationItems for the station
});
```
###### Methods:
```
rotationItem.updateBySongId({ _station: stationId,
                              _song: songId,
                               // either/or/and: weight:17, bin: 'active'
                              }, function (err, updatedRotationItem) {
  // updates the rotationItem 
});

rotationItem.updateWeight(newWeight, function (err, updatedRotationItem) {
  // updates the rotationItem's weight, stores the 
});

rotationItem.updateBin(newBin, function (err, updatedRotationItem) {
  // does the same with the 'bin'
});

rotationItem.updateWeightAndBin(newWeight, newBin, function (err, updatedRotationItem) {
  // take a guess :)
});
```
---------------------------
## Utilities
###### AudioConverter:
```javascript
AudioConverter.convertFile('/server/data/unprocessedAudio/dog.wav', function (err, newFilePath) {
  // converts wav, m4a to mp3 and returns the new filepath
});
```
###### AudioFileStorageHandler:
```javascript
newFilename = AudioFSH.cleanFilename('oldFilename');

AudioFSH.getStoredSongMetadata('stepladder_rachelLoy.mp3', function (err, newData) {
  // returns object with: title, album, artist, duration, echonestId
});

AudioFSH.storeSong({ filepath: '/server/data/processedAudio/stepladder.mp3',
                      artist: 'Rachel Loy',
                      title: 'Stepladder',
                      duration: 180000,
                      album: 'Broken Machine',
                      echonestId: 'ADFSASFD348FFA'
                    }, function (err, newKey) {
  // stores the song on s3 and returns the new key
});

AudioFSH.storeCommentary({ stationId: station.id,
                           filepath: '/server/data/processedAudio/sadfjhaksdfjh.mp3',
                          duration: 4500
                        }, function (err, newKey) {
  // stores a commentary and returns the new key
});

AudioFSH.getUnprocessedSong('fdsadfsfsda', function (err, filepath) {
  // grabs an unprocessed song, stores it in the data folder, and passes the new filepath
});

AudioFSH.deleteUnprocessedSong('adsffsad', function (err, data) {
  // deletes an unprocessed song
});

AudioFSH.deleteSong('stepladder.mp3', function (err, data) {
  // deletes a processed song
});

AudioFSH.updateMetadata({ key: 'asdfsadf.mp3',
                         duration: //or
                         title: // or
                         artist: //or
                         album: //or
                         echonestId: 
                       }, function (err, newMetadata) {
  // updates the metadata
});

AudioFSH.getAllSongs(function (err, allSongs) {
  // returns javascript object representations of all songs
});
```



###### Helper:
```javascript
Helper.saveAll([song1, song2, spin1, spin2], function (err, resultsArray) {
  // saves all objects in the array
});

Helper.removeAll([song1, song2], function (err, results) {
  // removes all objects in the array
});

Helper.cleanString('dog%$#@#$%cat');  // --> 'dogcat'   removes illegal url characters
Helper.cleanTitleString('asdf.,');                   // removes illegal title characters

```

###### Scheduler:
```javascript
Scheduler.generatePlaylist({ station: station }, function (err) {
  // generates and saves a playlist for the station for 2 hours from now
});

Scheduler.generatePlaylist({ station: station,
                              playlistEndTime(new Date(1983,3,15, 12,30 )) 
                            }, function (err) {
  // generates a playlist up until the provided playlistEndTime, as long
  // as that endTime is within the next week.
});

Scheduler.updateAirtimes({ station: station,
                           playlistPosition: 25,  // optional - last playlistPosition needed for accuracy
                           endTime: new Date(2015,3,15, 12,30)  // optional -- last time needed for accuracy
                         }, function (err, updatedStation) {
  // provides updatedStation with new lastAccuratePlaylistPosition
});

Scheduler.bringCurrent(station, function (err) {
  // moves the station forward until the present time
});

Scheduler.getProgram({ stationId: station.id }, function (err, program) {
  // returns a program object with program.nowPlaying (logEntry) && program.playlist(array of spins)
});

Scheduler.getCommercialBlockLink({ _user: user.id,
                                   airtime: new Date(2014,3,15, 12,30) // the airtime of the commercialBlock
                                  }, function (err, link) {
  // for now it just provides a direct link to the commercialBlock file
});

Scheduler.moveSpin({ spinId: spin.id,
                  newPlaylistPosition: 25 
                  }, function (err, updates) {
  // updates.updatedSpins & updates.updatedStation
});

Scheduler.removeSpin(spin, function (err, updatedStation) {
  // removes a spin from the playlist and provides an updatedStation
});

Scheduler.insertSpin({ playlistPosition: 25,
                        _station: station.id,
                        _audioBlock: song.id
                      }, function (err, updatedStation) {
  // inserts a spin, provides an updated version of station
});
```
###### SongPoolHandlerEmitter:
```javascript
var emitter = SongPool.addSong(addSong); // or SongPool.addSongs([song1, song2])
emitter.on('finish', function (err) {
  // adds songs to the song pool...
})

var emitter = SongPool.clearAllSongs()
emitter.on('finish', function (err) {
  // clears all songs from songPool
});

var emitter=SongPool.deleteSong('asdfasdfasdf'); // pass in the echonestId
emitter.on('finish', function (err, json) {
  //  deletes a song... provides the json echonest http response
})

SongPool.getSongSuggestions(['Rachel Loy',
                             'Randy Rogers Band',
                             'Wade Bowen'
                             ], function (err, finalList) {
  // provides a finalList array of song suggestions
});
```
###### SongProcessor:
```javascript
SongProcessor.getTags('/server/data/processedSongs/stepladder.mp3', function (err, tags) {
  // returns tag object with artist, album, title
});

SongProcessor.getItunesInfo({ artist: 'Rachel Loy',
                              title: 'Stepladder'
                            }, function (err, match) {
  // returns the closest match
});

SongProcessor.songMatchPossibilities({ artist: 'Rachel Loy',
                                       title: 'Stepladder'
                                     }, function (err, songsArray) {
  // songsArray contains echonest responses
});

SongProcessor.addSongToSystem('/server/data/processedAudio/stepladder.wav', function (err, newSong) {
  // gets tags, adds song to echonest, checks for existence in db, converts song, stores on s3, and adds to db.  Provides newSong object.

  // ERRORS: 'Song info not found'  -- not found on echonesat
  //         'No Id Info In File'   -- tags not found
  //         'Song Already Exists'  -- song exists
  //         'Audio File Storage Error'  -- problem with upload
});

SongProcessor.addSongViaEchonestId({  filepath: '/server/data/processedAudio/stepladder.wav',
                                      artist: 'Rachel Loy',
                                      album: 'Broken Machine',
                                      duration: 65002,
                                      echonestId: 'asdfasdasdfsda'
                                    }, function (err, newSong) {
  // adds a song that has been selected as a close match by the user
});

SongProcessor.getEchonestInfo({ artist: 'Rachel Loy',
                                title: 'Stepladder'
                               }, function (err, closestMatch) {
  // grabs the closest match from echonest
});
```

###### TimezoneFinder:
```javascript
TimezoneFinder.findByZip('78748', function (err, timezoneId) {
  // takes a zipcode, provides the proper timezoneId string
});
```