require([ "jquery", "/socket.io/socket.io.js", "delivery"], function() {

  var socket = io.connect();

  var delivery = new Delivery(socket);

  console.log('running ipcam.js');

  delivery.on('receive.success',function(file) {
    console.log('hallo');
    if (file.isImage()) {
      $('img[data-id="' + file.name + '"]').attr('src', file.dataURL());
    };
  });
  /**
   * Image data received
   */
  socket.on('webcam-motion', function(data) {
    $('img[data-id="' + data.id + '.jpg"]').attr('src', data.data);
  });

});
