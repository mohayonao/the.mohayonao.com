(function() {
  $(function() {
    'use strict';
    var ImageProcessor, canvas, image, onerror, onsuccess, processor, video;
    ImageProcessor = (function() {
      function ImageProcessor() {
        this.canvas = document.createElement('canvas');
        this.width = this.canvas.width = 256;
        this.height = this.canvas.height = 256;
        this.context = this.canvas.getContext('2d');
        this.mirror = false;
      }

      ImageProcessor.prototype.setSize = function(width, height) {
        this.width = this.canvas.width = width;
        return this.height = this.canvas.height = height;
      };

      ImageProcessor.prototype.process = function(src, dst) {
        var context, imageData;
        context = dst.getContext('2d');
        if (!this.mirror) {
          this.context.translate(src.width, 0);
          this.context.scale(-1, 1);
          this.mirror = true;
        }
        this.context.drawImage(src, 0, 0, src.width, src.height);
        imageData = this.context.getImageData(0, 0, this.width, this.height);
        return context.putImageData(imageData, 0, 0);
      };

      return ImageProcessor;

    })();
    video = document.getElementById('cam');
    canvas = document.getElementById('canvas');
    processor = new ImageProcessor;
    image = document.getElementById('src');
    $(image).on('load', function() {
      processor.setSize(this.width, this.height);
      return processor.process(this, canvas);
    });
    onsuccess = function(stream) {
      video.src = window.webkitURL.createObjectURL(stream);
      return apps.animate(function() {
        return processor.process(video, canvas);
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
