(function() {
  $(function() {
    'use strict';
    var ImageProcessor, animate, canvas, func, image, onerror, onsuccess, processor, video;

    func = function(imageData) {
      var data, gray, i, _i, _ref;

      data = imageData.data;
      for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
        gray = 0.114 * data[i] + 0.587 * data[i + 1] + 0.299 * data[i + 2];
        data[i + 0] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      return 0;
    };
    ImageProcessor = (function() {
      function ImageProcessor(func) {
        this.func = func;
        this.canvas = document.createElement('canvas');
        this.width = this.canvas.width = 256;
        this.height = this.canvas.height = 256;
        this.context = this.canvas.getContext('2d');
      }

      ImageProcessor.prototype.setSize = function(width, height) {
        this.width = this.canvas.width = width;
        return this.height = this.canvas.height = height;
      };

      ImageProcessor.prototype.process = function(src, dst) {
        var context, imageData;

        context = dst.getContext('2d');
        this.context.drawImage(src, 0, 0, src.width, src.height);
        imageData = this.context.getImageData(0, 0, this.width, this.height);
        if (typeof this.func === "function") {
          this.func(imageData);
        }
        return context.putImageData(imageData, 0, 0);
      };

      return ImageProcessor;

    })();
    animate = function(now) {
      processor.process(video, canvas);
      return requestAnimationFrame(animate);
    };
    video = document.getElementById('cam');
    canvas = document.getElementById('canvas');
    processor = new ImageProcessor(func);
    image = document.getElementById('src');
    $(image).on('load', function() {
      processor.setSize(this.width, this.height);
      return processor.process(this, canvas);
    });
    onsuccess = function(stream) {
      video.src = window.webkitURL.createObjectURL(stream);
      return requestAnimationFrame(animate);
    };
    onerror = function(error) {
      return console.log(error);
    };
    return navigator.webkitGetUserMedia({
      audio: false,
      video: true
    }, onsuccess, onerror);
  });

}).call(this);
