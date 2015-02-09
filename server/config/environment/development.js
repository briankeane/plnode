'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/pl2nodeyo-dev'
  },

  seedDB: false,

  s3Buckets: { 
    SONGS_BUCKET: 'playolasongs',
    COMMERCIALS_BUCKET: 'playolacommercials',
    COMMENTARIES_BUCKET: 'playolacommentaries',
    UNPROCESSED_SONGS: 'playolaunprocessedsongs'
  }
};
