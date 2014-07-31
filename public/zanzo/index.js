(function() {
  $(function() {
    'use strict';
    var App, app;
    App = (function() {
      function App() {}

      App.prototype.generate = function(buffer) {
        var worker;
        worker = new Worker('./worker.js');
        worker.postMessage(buffer, [buffer]);
        return worker.onmessage = (function(_this) {
          return function(e) {
            var func;
            func = _this[e.data.type];
            if (_.isFunction(func)) {
              return func.apply(_this, e.data.args);
            }
          };
        })(this);
      };

      App.prototype.info = function(numFrames, width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d');
        this.image = this.context.createImageData(this.width, this.height);
        return $('#result').empty().append(this.canvas);
      };

      App.prototype.progress = function(data) {
        this.image.data.set(data);
        return this.context.putImageData(this.image, 0, 0);
      };

      App.prototype.result = function() {
        var image;
        image = new Image;
        image.src = this.canvas.toDataURL('image/png');
        image.width = this.width;
        image.height = this.height;
        return $('#result').empty().append(image);
      };

      return App;

    })();
    app = new App;
    $(window).on('dragover', function(e) {
      return false;
    });
    return $(window).on('drop', function(e) {
      var file, reader;
      file = e.originalEvent.dataTransfer.files[0];
      if (file.type === 'image/gif') {
        reader = new FileReader;
        reader.onload = function() {
          return app.generate(reader.result);
        };
        reader.readAsArrayBuffer(file);
      }
      return false;
    });
  });

}).call(this);
