# plNode

---------------------------
## Models

### User
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **twitter**             | *String*                    | user's twitter handle           |
| **twitterUID**          | *String*                    | user's twitter user id          |
| **email**               | *String*                    | users email                     |
| **birthYear**           | *Number*                    | users birthyear                 |
| **gender**              | *String*                    | users gender                    |
| **zipcode**             | *String*                    | zipcode                         |
| **profileImageUrl**     | *String*                    | location of stored picture      |
| **_station**            | *reference to 'Station'*    | the user's station              |

### Station
| Property                                | Type                        | Description                                   |
| --------                                | :---:                       | :-------:                                     |
| **_user**                               | *reference to 'User'*       | its owning user                               |
| **secsOfCommercialPerHour**             | *Number*                    | secs of commercials per hour                  |
| **lastAccuratePlaylistPosition**        | *Number*                    | limit of station accuracy in playlistPositon  |
| **lastAccurateAirtime**                 | *Date*                      | limit of station accuracy in Datetime         |
| **averageDailyListeners**               | *Number*                    | average of how many listeners per day         |
| **averageDailyListenersCalculationDate**| *Date*                      | calculation date of averageDailyListeners     |
| **timezone**                            | *String*                    | for proper station time display               |

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

#### CommercialBlock (inherit from audioBlock)
| Property                | Type                        | Description                     |
| --------                | :---:                       | :-------:                       |
| **duration**            | *Number*                    | in ms                           |

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
| **itunesTrackViewUrl**  | *String*                    | link to iTunes purchase page    |


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

Song.all(function (songArray) {
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
```
#### Spin
| Property              | Type                        | Description                                     |
| --------              | :---:                       | :-------:                                       |
| **playlistPosition**  |*Number*                     | current position in playlist order              |
| **_audioBlock**       |*reference to 'AudioBlock'*  | contains its song or commentary                 |
| **_station**          |*reference to 'Station'*     | its owning station                              |
| **airtime**           |*Date*                       | the currently scheduled airtime                 |
| **durationOffset**    |*Number, default: 0*         | positive or negative. allows blending of songs  |

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
###### Helper:
```javascript
Hepler.saveAll([song1, song2, spin1, spin2], function (err, resultsArray) {
  // saves all objects in the array
});
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
```
