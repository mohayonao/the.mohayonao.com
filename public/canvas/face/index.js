(function() {
  'use strict';
  $(function() {
    var DetectProcessor, ImageProcessor, canvas, mirror, onerror, onsuccess, processor, video;
    mirror = function(imageData) {
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
    DetectProcessor = (function() {
      var _onmessage, _send;

      function DetectProcessor() {
        this.canvas = document.createElement('canvas');
        this.width = this.canvas.width = 160;
        this.height = this.canvas.height = 120;
        this.context = this.canvas.getContext('2d');
      }

      DetectProcessor.prototype.process = function(src) {
        var detector;
        this.context.drawImage(src, 0, 0, src.width, src.height, 0, 0, this.width, this.height);
        detector = ccv.detect_objects({
          canvas: this.canvas,
          cascade: cascade,
          interval: 5,
          min_neighbors: 1
        });
        return this.detect = detector.shift();
      };

      _onmessage = function(e) {
        var dfd;
        switch (e.data.type) {
          case 'console':
            return console.log.apply(console, e.data.data);
          case 'return':
            dfd = this.pool[e.data.index];
            if (dfd) {
              dfd.resolve(e.data.data);
            }
            return delete this.pool[e.data.index];
        }
      };

      _send = function(type) {
        var data, dfd, index;
        index = this.index++;
        data = slice.call(arguments, 1);
        if (data.length <= 1) {
          data = data[0];
        }
        dfd = this.pool[index] = new $.Deferred;
        this.worker.postMessage({
          type: type,
          index: index,
          data: data
        });
        return dfd.promise();
      };

      return DetectProcessor;

    })();
    ImageProcessor = (function() {
      function ImageProcessor(func) {
        this.func = func;
        this.detector = new DetectProcessor;
        this.canvas = document.createElement('canvas');
        this.width = this.canvas.width = 320;
        this.height = this.canvas.height = 240;
        this.context = this.canvas.getContext('2d');
      }

      ImageProcessor.prototype.process = function(src, dst) {
        var context, detect, h, imageData, scale, w, x, y;
        this.detector.process(src);
        this.context.drawImage(src, 0, 0, src.width, src.height, 0, 0, this.width, this.height);
        imageData = this.context.getImageData(0, 0, this.width, this.height);
        if (typeof this.func === "function") {
          this.func(imageData);
        }
        context = dst.getContext('2d');
        context.putImageData(imageData, 0, 0);
        scale = this.width / this.detector.width;
        if ((detect = this.detector.detect)) {
          x = this.width - (detect.x + detect.width) * scale;
          y = detect.y * scale;
          w = detect.width * scale;
          h = detect.height * scale;
          context.fillStyle = 'rgba(255,255,255,0.25)';
          return context.fillRect(x, y, w, h);
        }
      };

      return ImageProcessor;

    })();
    video = document.getElementById('cam');
    canvas = document.getElementById('canvas');
    processor = new ImageProcessor(mirror);
    onsuccess = function(stream) {
      video.src = createObjectURL(stream);
      return utils.animate({
        fps: 5
      }, function() {
        processor.process(video, canvas);
        return true;
      });
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
