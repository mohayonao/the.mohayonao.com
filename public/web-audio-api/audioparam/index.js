(function() {
  var param;

  param = null;

  $(function() {
    'use strict';
    var CONTROL_SAMPLES, SAMPLERATE, calcY, clear, draw, drawGrid, drawTime, drawValues, drawrange, editor, getValues, vue;
    SAMPLERATE = 44100;
    CONTROL_SAMPLES = 128;
    draw = function(values, duration, range) {
      var canvas, context;
      canvas = document.getElementById('canvas');
      context = canvas.getContext('2d');
      clear(context, canvas.width, canvas.height);
      drawGrid(context, canvas.width, canvas.height);
      drawValues(context, canvas.width, canvas.height, values, range);
      drawTime(context, canvas.width, canvas.height, duration);
      return drawrange(context, canvas.width, canvas.height, range);
    };
    clear = function(context, width, height) {
      return context.clearRect(0, 0, width, height);
    };
    drawGrid = function(context, width, height, duration) {
      var i, x, y, _i;
      context.save();
      context.strokeStyle = '#bdc3c7';
      context.lineWidth = 1;
      for (i = _i = 1; _i <= 9; i = ++_i) {
        x = Math.floor((width / 10) * i);
        y = Math.floor((height / 10) * i);
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      return context.restore();
    };
    drawTime = function(context, width, height, duration) {
      var i, t, x, _i;
      context.save();
      context.fillStyle = '#7f8c8d';
      context.font = "18px monospace";
      for (i = _i = 0; _i <= 9; i = ++_i) {
        x = Math.floor((width / 10) * i);
        t = (duration / 10) * i;
        context.fillText(t.toFixed(1), x + 3, height - 2);
      }
      return context.restore();
    };
    drawrange = function(context, width, height, range) {
      var i, t, y, _i;
      context.save();
      context.fillStyle = '#7f8c8d';
      context.font = "18px monospace";
      for (i = _i = 1; _i <= 9; i = ++_i) {
        y = height - (Math.floor((height / 10) * i));
        t = (range / 10) * i;
        context.fillText(t.toFixed(1), 3, y - 4);
      }
      return context.restore();
    };
    drawValues = function(context, width, height, values, max) {
      var dx, i, min, value, x, y, _i, _len;
      context.save();
      dx = width / values.length;
      min = 0;
      context.strokeStyle = '#e74c3c';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(0, calcY(values[0], height, min, max));
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        x = dx * i;
        y = calcY(value, height, min, max);
        context.lineTo(x, y);
      }
      context.stroke();
      return context.restore();
    };
    getValues = function(code, duration, callback) {
      var audioContext, bufSrc, gain, sampleRate;
      audioContext = new OfflineAudioContext(1, 30 * SAMPLERATE, SAMPLERATE);
      sampleRate = audioContext.sampleRate;
      gain = audioContext.createGain();
      bufSrc = audioContext.createBufferSource();
      bufSrc.buffer = audioContext.createBuffer(1, 2, 44100);
      bufSrc.buffer.getChannelData(0).set(new Float32Array([1, 1]));
      bufSrc.loop = true;
      bufSrc.start(0);
      bufSrc.connect(gain);
      gain.connect(audioContext.destination);
      param = gain.gain;
      eval(code);
      audioContext.oncomplete = function(e) {
        var buffer, i, length, values, _i;
        buffer = e.renderedBuffer.getChannelData(0);
        length = Math.floor(buffer.length / CONTROL_SAMPLES);
        values = new Float32Array(length);
        for (i = _i = 0; _i < length; i = _i += 1) {
          values[i] = buffer[i * CONTROL_SAMPLES];
        }
        return callback(values);
      };
      return audioContext.startRendering();
    };
    calcY = function(value, height, min, max) {
      value = value / (max - min);
      return height - height * value;
    };
    vue = new Vue({
      el: '#app',
      data: {
        width: 700,
        height: 350,
        duration: 1,
        range: 1,
        values: [[]],
        shared: ''
      },
      computed: {
        durationVal: {
          $get: function() {
            return [0.5, 1, 2, 3, 4, 5, 7.5, 10, 15, 20, 30][this.duration];
          }
        },
        rangeVal: {
          $get: function() {
            return [0.5, 1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 150000][this.range];
          }
        }
      },
      methods: {
        draw: function() {
          return this.update(editor.getValue());
        },
        update: function(code) {
          return getValues(code, 30, (function(_this) {
            return function(values) {
              _this.values[0] = values;
              return _this.change();
            };
          })(this));
        },
        change: function() {
          var length, values;
          length = Math.floor(this.durationVal * SAMPLERATE / CONTROL_SAMPLES);
          values = this.values[0].subarray(0, length);
          return draw(values, this.durationVal, this.rangeVal);
        },
        clear: function() {
          return editor.setValue('');
        },
        share: function(e) {
          var code, hash;
          code = editor.getValue();
          hash = '#' + window.encodeURIComponent(code.trim());
          return this.shared = "" + window.location.protocol + "//" + window.location.host + window.location.pathname + hash;
        }
      }
    });
    editor = CodeMirror(document.getElementById('editor'), {
      mode: 'javascript',
      theme: 'monokai',
      workTime: 200,
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-O': 'autocomplete'
      }
    });
    CodeMirror.commands.autocomplete = function(cm) {
      return CodeMirror.showHint(cm, CodeMirror.hint.audioparam);
    };
    CodeMirror.hint.audioparam = function(cm) {
      return {
        from: cm.getCursor(),
        to: cm.getCursor(),
        list: ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'setValueCurveAtTime', 'cancelScheduledValues']
      };
    };
    if (window.location.hash) {
      editor.setValue(window.decodeURIComponent(window.location.hash.substr(1)));
    } else {
      editor.setValue('var t0 = 0;\nvar t1 = 0.1;\nvar t2 = 0.2;\nvar t3 = 0.3;\nvar t4 = 0.4;\nvar t5 = 0.6;\nvar t6 = 0.7;\nvar t7 = 1.0;\n\nvar curveLength = 44100;\nvar curve = new Float32Array(curveLength);\nfor (var i = 0; i < curveLength; ++i)\n    curve[i] = Math.sin(Math.PI * i / curveLength);\n\nparam.setValueAtTime(0.2, t0);\nparam.setValueAtTime(0.3, t1);\nparam.setValueAtTime(0.4, t2);\nparam.linearRampToValueAtTime(1, t3);\nparam.linearRampToValueAtTime(0.15, t4);\nparam.exponentialRampToValueAtTime(0.75, t5);\nparam.exponentialRampToValueAtTime(0.05, t6);\nparam.setValueCurveAtTime(curve, t6, t7 - t6);');
      vue.update(editor.getValue());
    }
    return hljs.initHighlightingOnLoad();
  });

}).call(this);
