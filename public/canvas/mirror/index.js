(function() {
  $(function() {
    'use strict';
    var ImageProcessor, animate, canvas, func, image, onerror, onsuccess, processor, video;

    func = function(imageData) {
      var data, height, i, j, width, x, y, _i, _j, _ref, _ref1, _ref2, _ref3;

      data = imageData.data;
      width = imageData.width;
      height = imageData.height;
      for (y = _i = 0; _i < height; y = _i += 1) {
        for (x = _j = 0, _ref = width >> 1; _j < _ref; x = _j += 1) {
          i = ((y + 0) * width + x) * 4;
          j = ((y + 1) * width - x - 1) * 4;
          _ref1 = [data[j + 0], data[i + 0]], data[i + 0] = _ref1[0], data[j + 0] = _ref1[1];
          _ref2 = [data[j + 1], data[i + 1]], data[i + 1] = _ref2[0], data[j + 1] = _ref2[1];
          _ref3 = [data[j + 2], data[i + 2]], data[i + 2] = _ref3[0], data[j + 2] = _ref3[1];
        }
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
      apps.stats(function() {
        return processor.process(video, canvas);
      });
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
