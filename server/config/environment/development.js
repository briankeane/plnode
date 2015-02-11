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
  },

  ECHONEST_TASTE_PROFILE_ID: 'CALBLSS14721C1C716'
};
