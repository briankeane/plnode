var echojs = require('echojs');
var echo = echojs({ key: process.env.ECHONEST_KEY });

function Handler() {
  var self = this;

  this.clearAllSongs = function (callback) {
      debugger;
    echo('tasteprofile/read').get({ id: 'CALBLSS14721C1C716', results: 1000 }, function (err, json) {
      console.log(json.response);
      console.log(obj.response.catalog.items);
    });
  };
}

module.exports = new Handler();