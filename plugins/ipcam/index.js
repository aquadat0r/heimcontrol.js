if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'wget', 'curlrequest', 'delivery', 'fs', 'mv' ], function(Wget, Curl, Delivery, Fs, Mv) {

  /*
   * IPcam Plugin. Can access the GPIO on the Raspberry PI
   *
   * @class IPcam
   * @param {Object} app The express application
   * @constructor 
   */
  var IPcam = function(app) {

    this.name = 'IP Cameras';
    this.collection = 'IPcam';
    this.id = 'ipcam';
    this.icon = 'icon-camera';

    this.app = app;
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    this.ipcamList = [];
    this.ipcams = {};
    this.deliveryList = [];
    this.init();

    var that = this;
     	
    app.get('events').on('settings-saved', function() {
      that.init();
    });

    app.get('sockets').on('connection', function(socket) {
      var delivery = Delivery.listen(socket);
      that.deliveryList.push(delivery);

      socket.on('disconnect', function() {
        that.deliveryList.forEach(function(delivery) {
          if (delivery.socket.id == socket.id) {
            var i = that.deliveryList.indexOf(delivery);
            that.deliveryList.splice(i,1);
          }
        });
      });
    });
  };

  IPcam.prototype.init = function() {

    var that = this;
    console.log('Getting Snapshot');    
    this.ipcamList.forEach(function(ipcam) {
      clearInterval(ipcam);
    });
    this.ipcam = [];

    return this.app.get('db').collection(that.collection, function(err, collection) {
      collection.find().toArray(function(err, result) {
        if ((!err) && (result.length > 0)) {
          result.forEach(function(item) {

              function capture() {
                if (that.app.get('clients').length > 0) {
                  var dest = '/tmp/' + item._id + '.jpg'; 
                  var src = item.snapshoturl;
                  var options = {
                  	method: 'GET'
                      };            
 /*                 Fs.unlink(dest, function (err) {
                      if (err) console.log('error encountered deleting');
                      console.log('successfully deleted /tmp/hello');
                  });                      
*/                  var download = Wget.download(src, dest, options);
            	  console.log('Downloading image');
                  download.on('error', function(err) {
                      console.log(err);
                  });

                  download.on('end', function(output) {
                      console.log(output);
                      that.deliveryList.forEach(function(delivery) {
                           delivery.send({
                                name: item._id + '.jpg',
                                path: dest
                           });
                      });
                  });            
                }
              }
              var intervalId = setInterval(capture, parseInt(item.interval)*1000);
              that.ipcamList.push(intervalId);
          });
        }
      });
    });
  }

  /**
   * Manipulate the items array before render
   *
   * @method beforeRender
   * @param {Array} items An array containing the items to be rendered
   * @param {Function} callback The callback method to execute after manipulation
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result The manipulated items
   */
  IPcam.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  }

  var exports = IPcam;

  return IPcam;

});
