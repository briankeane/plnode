var config = require('../../config/environment');
var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });
var _ = require('lodash');

function Handler() {
  var self = this;

  this.clearAllSongs = function (callback) {

    function deleteChunk() {

      echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {
        if (!json.response["catalog"]["items"].length) {
          callback();
          return;
        }
        console.log(json.response["catalog"]["items"]);
        var deleteObjectArray = _.map(json.response["catalog"]["items"], function (item) {
          var deleteItem = {
            "action": "delete",
            "item": {
              "item_id": item["request"]["item_id"]
            }
          };
          echo('tasteprofile/update').get({ data: deleteObjectArray }, function (err, json) {
            echo('tasteprofile/read').get({ id: config.ECHONEST_TASTE_PROFILE_ID, results: 1000 }, function (err, json) {
              if (!json.response["catalog"]["items"].length) {
                callback();
              } else {
                deleteChunk();
              }
            });
          });
        });
      });
    }

    deleteChunk();
  };
}

module.exports = new Handler();