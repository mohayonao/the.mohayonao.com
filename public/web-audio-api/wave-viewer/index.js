(function() {
  $(function() {
    'use strict';
    var audioContext, buffer, canvas, context, draw, main, range, render, renderSize, timerId, zoom, _render;
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
    timerId = 0;
    renderSize = audioContext.sampleRate;
    render = function() {
      if (buffer) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        return requestAnimationFrame(function() {
          return _render(0);
        });
      }
    };
    _render = function(index) {
      var ch, data, length, _i, _ref;
      length = Math.floor(buffer.length * range);
      for (ch = _i = 0, _ref = buffer.numberOfChannels; _i < _ref; ch = _i += 1) {
        data = buffer.getChannelData(ch);
        data = data.subarray(index * renderSize, index * renderSize + renderSize);
        draw(data, length, ch, index);
      }
      if (index * renderSize < length) {
        return requestAnimationFrame(function() {
          return _render(index + 1);
        });
      }
    };
    draw = function(data, length, ch, index) {
      var cX, cY, height, i, width, x, y, _i, _ref;
      width = canvas.width;
      height = canvas.height * 0.5;
      cX = index * renderSize;
      cY = height * 0.5 + height * ch;
      context.beginPath();
      for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 1) {
        x = ((i + cX) / length) * width;
        y = cY - data[i] * height * zoom * 0.5;
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
