(function() {
  $(function() {
    'use strict';
    var canvas, context, draw, image;

    canvas = document.getElementById('result');
    canvas.width = 512;
    canvas.height = 512;
    context = canvas.getContext('2d');
    draw = function(param) {
      var data, gray, i, _i, _ref;

      if (image.saved) {
        param = (param * 256) | 0;
        image.imageData.data.set(image.saved);
        data = image.imageData.data;
        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
          gray = 0.114 * data[i] + 0.587 * data[i + 1] + 0.299 * data[i + 2];
          data[i + 0] = data[i + 1] = data[i + 2] = gray < param ? 0 : 255;
        }
        return context.putImageData(image.imageData, 0, 0);
      }
    };
    $('#param').on('change', function() {
      return draw($(this).val() * 0.01);
    });
    image = document.getElementById('src');
    return $(image).on('load', function() {
      context.drawImage(this, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height);
      image.imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      image.saved = new Uint8ClampedArray(image.imageData.data);
      return draw(0.4);
    });
  });

}).call(this);
