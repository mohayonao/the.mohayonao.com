(function() {
  $(function() {
    'use strict';
    var SAMPLERATE, Settings, capture, draw, waves;
    SAMPLERATE = 44100;
    Settings = [
      {
        type: "sine",
        freq: 1
      }, {
        type: "square",
        freq: 1
      }, {
        type: "sawtooth",
        freq: 1
      }, {
        type: "triangle",
        freq: 1
      }, {
        type: "sine",
        freq: 10
      }, {
        type: "square",
        freq: 10
      }, {
        type: "sawtooth",
        freq: 10
      }, {
        type: "triangle",
        freq: 10
      }, {
        type: "sine",
        freq: 441
      }, {
        type: "square",
        freq: 441
      }, {
        type: "sawtooth",
        freq: 441
      }, {
        type: "triangle",
        freq: 441
      }, {
        type: "sine",
        freq: 882
      }, {
        type: "square",
        freq: 882
      }, {
        type: "sawtooth",
        freq: 882
      }, {
        type: "triangle",
        freq: 882
      }
    ];
    waves = {
      sine: PeriodicWave.createSine(),
      square: PeriodicWave.createSquare(),
      sawtooth: PeriodicWave.createSawtooth(),
      triangle: PeriodicWave.createTriangle()
    };
    capture = function(type, freq, callback) {
      var audioContext, length, oscillator;
      length = Math.ceil(SAMPLERATE / freq);
      audioContext = new OfflineAudioContext(1, length, SAMPLERATE);
      audioContext.oncomplete = function(e) {
        var buffer;
        buffer = e.renderedBuffer.getChannelData(0);
        return callback(buffer);
      };
      oscillator = audioContext.createOscillator();
      oscillator.setPeriodicWave(audioContext.createPeriodicWave(waves[type].real, waves[type].imag));
      oscillator.frequency.value = freq;
      oscillator.start(0);
      oscillator.connect(audioContext.destination);
      return audioContext.startRendering();
    };
    draw = function(setting, canvas) {
      return capture(setting.type, setting.freq, function(data) {
        var context, i, text, textWidth, x, y, _i, _ref;
        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#0c0';
        context.beginPath();
        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 1) {
          x = Math.round((i / (data.length - 1)) * canvas.width);
          y = canvas.height * 0.5 - data[i] * canvas.height * 0.5;
          context.lineTo(x, y);
        }
        context.stroke();
        context.fillStyle = '#0f0';
        text = "type= " + setting.type + "; freq= " + setting.freq + "Hz";
        textWidth = context.measureText(text).width;
        return context.fillText(text, canvas.width - textWidth - 4, 12);
      });
    };
    return $('canvas').each(function(i, elem) {
      elem.width = 240;
      elem.height = 120;
      if (Settings[i]) {
        return draw(Settings[i], elem);
      }
    });
  });

}).call(this);
