(function() {
  $(function() {
    'use strict';
    var audioContext, buffer, canvas, context, draw, main, range, render, zoom;
    audioContext = new AudioContext();
    canvas = document.getElementById('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    context = canvas.getContext('2d');
    context.fillStyle = '#ecf0f1';
    context.strokeStyle = '#2c3e50';
    context.lineWidth = 0.1;
    zoom = 1;
    range = 1;
    buffer = null;
    render = function() {
      var ch, data, i, _i, _results;
      if (buffer) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        ch = buffer.numberOfChannels;
        _results = [];
        for (i = _i = 0; _i < ch; i = _i += 1) {
          data = buffer.getChannelData(i);
          data = data.subarray(0, Math.floor(data.length * range));
          _results.push(draw(data, i));
        }
        return _results;
      }
    };
    draw = function(data, index) {
      var cY, height, i, length, width, x, y, _i, _ref;
      width = canvas.width;
      height = canvas.height * 0.5;
      cY = height * 0.5 + height * index;
      length = data.length;
      context.beginPath();
      for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 1) {
        x = (i / length) * width;
        y = cY - data[i] * height * zoom;
        context.lineTo(x, y);
      }
      return context.stroke();
    };
    main = function(file) {
      var reader;
      reader = new FileReader;
      reader.onload = function(e) {
        return audioContext.decodeAudioData(e.target.result, function(result) {
          buffer = result;
          return render();
        });
      };
      return reader.readAsArrayBuffer(file);
    };
    $(window).on('dragover', function() {
      return false;
    });
    $(window).on('drop', function(e) {
      main(e.originalEvent.dataTransfer.files[0]);
      return false;
    });
    $('#zoom').on('change', _.throttle(function(e) {
      zoom = Math.pow(1.25, e.target.value - 5);
      return render();
    }, 150));
    return $('#range').on('change', _.throttle(function(e) {
      range = Math.pow(1.05, e.target.value - 50);
      return render();
    }, 150));
  });

}).call(this);
