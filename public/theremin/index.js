(function() {
  'use strict';
  var filename, slice;

  filename = 'index.js';

  slice = [].slice;

  if (typeof window !== 'undefined') {
    $(function() {
      var DetectProcessor, ImageProcessor, SoundProcessor, canvas, onerror, onsuccess, processor, sound, video;
      sc.use('prototype');
      timbre.setup({
        samplerate: timbre.samplerate * 0.5
      });
      DetectProcessor = (function() {
        var _onmessage, _send;

        function DetectProcessor() {
          var privates;
          this.worker = new Worker(filename);
          privates = {
            worker: this.worker,
            index: 0,
            pool: {}
          };
          this.send = _send.bind(privates);
          this.worker.addEventListener('message', _onmessage.bind(privates));
          this.canvas = document.createElement('canvas');
          this.width = this.canvas.width = 160;
          this.height = this.canvas.height = 120;
          this.context = this.canvas.getContext('2d');
        }

        DetectProcessor.prototype.process = function(src) {
          var imageData;
          this.context.drawImage(src, 0, 0, src.width, src.height, 0, 0, this.width, this.height);
          imageData = this.context.getImageData(0, 0, this.width, this.height);
          return this.send('process', imageData).then((function(_this) {
            return function(data) {
              return _this.detect = data;
            };
          })(this));
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
        function ImageProcessor() {
          this.detector = new DetectProcessor;
          this.canvas = document.createElement('canvas');
          this.width = this.canvas.width = 320;
          this.height = this.canvas.height = 240;
          this.context = this.canvas.getContext('2d');
          this.mirror = false;
        }

        ImageProcessor.prototype.setSize = function(width, height) {
          this.width = this.canvas.width = width;
          return this.height = this.canvas.height = height;
        };

        ImageProcessor.prototype.process = function(src, dst) {
          var context, imageData, left, right, scale, x, y;
          this.detector.process(src);
          if (!this.mirror) {
            this.context.translate(src.width, 0);
            this.context.scale(-1, 1);
            this.mirror = true;
          }
          this.context.drawImage(src, 0, 0, src.width, src.height, this.width, 0, this.width, this.height);
          imageData = this.context.getImageData(0, 0, this.width, this.height);
          context = dst.getContext('2d');
          context.putImageData(imageData, 0, 0);
          scale = this.width / this.detector.width;
          x = (this.width / 5) | 0;
          y = (this.height / 3) | 0;
          context.fillStyle = 'rgba(255,255,255,0.25)';
          context.fillRect(0, this.height - y, x, y);
          context.fillRect(this.width - x, 0, x, this.height);
          if (this.detector.detect) {
            context.strokeStyle = '#006';
            context.fillStyle = 'rgba(255,255,0,0.5)';
            left = this.detector.detect.right;
            if (left.y * scale < this.height - y) {
              left.y = -1;
            } else if (left.y !== -1) {
              x = this.width - left.x * scale;
              context.beginPath();
              context.arc(x, left.y * scale, 5, 0, Math.PI * 2, true);
              context.fill();
              context.stroke();
            }
            right = this.detector.detect.left;
            if (right.y !== -1) {
              x = this.width - right.x * scale;
              context.beginPath();
              context.arc(x, right.y * scale, 5, 0, Math.PI * 2, true);
              context.fill();
              context.stroke();
            }
            return typeof this.callback === "function" ? this.callback({
              left: left.y === -1 ? -1 : left.y * scale / this.height,
              right: right.y === -1 ? -1 : right.y * scale / this.height
            }) : void 0;
          }
        };

        return ImageProcessor;

      })();
      SoundProcessor = (function() {
        function SoundProcessor() {
          this.freq = T("param", {
            value: 880
          });
          this.vco = T("sin", {
            freq: T("+", T("sin", {
              kr: true,
              freq: 4,
              mul: 2
            }), {
              mul: 0.5
            }, this.freq)
          });
          this.amp = T("param", {
            value: 0
          });
          this.vca = T("*", this.amp, this.vco);
          this.master = T("delay", {
            time: 150,
            fb: 0.5
          }, this.vca);
          this.scale = sc.Scale.major();
        }

        SoundProcessor.prototype.play = function() {
          return this.master.play();
        };

        SoundProcessor.prototype.pause = function() {
          return this.master.pause();
        };

        return SoundProcessor;

      })();
      video = document.getElementById('cam');
      canvas = document.getElementById('canvas');
      processor = new ImageProcessor;
      sound = new SoundProcessor;
      processor.callback = function(opts) {
        var amp, degree, freq;
        freq = opts.right;
        if (freq !== -1) {
          degree = ((1 - freq) * 20) | 0;
          if (this.degree == null) {
            this.degree = degree;
            freq = sound.scale.degreeToFreq(degree, 220);
            sound.freq.value = freq;
          } else if (this.degree !== degree) {
            this.degree = degree;
            freq = sound.scale.degreeToFreq(degree, 220);
            sound.freq.linTo(freq, 250);
          }
        }
        amp = opts.left !== -1;
        if (this.amp == null) {
          if (amp) {
            sound.amp.value = 1;
          } else {
            sound.amp.value = 0;
          }
        } else if (this.amp !== amp) {
          if (amp) {
            sound.amp.linTo(1, 250);
          } else {
            sound.amp.linTo(0, 1000);
          }
        }
        return this.amp = amp;
      };
      onsuccess = function(stream) {
        video.src = window.webkitURL.createObjectURL(stream);
        sound.play();
        return apps.animate({
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
  } else {
    (function(worker) {
      var console, process, rgb2hsv, send;
      console = {
        log: function() {
          return worker.postMessage({
            type: 'console',
            data: slice.call(arguments)
          });
        }
      };
      send = function(index, data) {
        return worker.postMessage({
          type: 'return',
          index: index,
          data: data
        });
      };
      rgb2hsv = function(r, g, b) {
        var c, cmax, cmin, h, s, v;
        h = s = v = 0;
        cmax = Math.max(r, g, b);
        cmin = Math.min(r, g, b);
        v = cmax;
        c = cmax - cmin;
        if (cmax !== 0) {
          s = c / cmax;
        }
        if (c !== 0) {
          switch (false) {
            case r !== cmax:
              h = 0 + (g - b) / c;
              break;
            case g !== cmax:
              h = 2 + (b - r) / c;
              break;
            default:
              h = 4 + (r - g) / c;
          }
          h *= 60;
          if (h < 0) {
            h += 360;
          }
        }
        return {
          h: h,
          s: s,
          v: v
        };
      };
      process = function(imageData) {
        var center, data, h, height, i, left, obj, right, s, thres, v, width, x, y, _i, _ref, _ref1, _ref2;
        width = imageData.width, height = imageData.height, data = imageData.data;
        left = {
          x: 0,
          y: 0,
          c: 0,
          width: (width / 5) | 0
        };
        center = {
          x: 0,
          y: 0,
          c: 0
        };
        right = {
          x: 0,
          y: 0,
          c: 0,
          width: width - left.width
        };
        thres = ((width * height) * 0.0025) | 0;
        x = y = 0;
        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
          _ref1 = rgb2hsv(data[i + 0], data[i + 1], data[i + 2]), h = _ref1.h, s = _ref1.s, v = _ref1.v;
          x += 1;
          if (x === width) {
            _ref2 = [0, y + 1], x = _ref2[0], y = _ref2[1];
          }
          if ((0 <= h && h <= 30) && 0.15 <= s && 0.15 <= v) {
            obj = (function() {
              switch (false) {
                case !(x <= left.width):
                  return left;
                case !(x >= right.width):
                  return right;
                default:
                  return center;
              }
            })();
            obj.x += x;
            obj.y += y;
            obj.c += 1;
          }
        }
        if (left.c >= thres) {
          left.x /= left.c;
          left.y /= left.c;
        } else {
          left.x = -1;
          left.y = -1;
        }
        if (center.c >= thres) {
          center.x /= center.c;
          center.y /= center.c;
        } else {
          center.x = -1;
          center.y = -1;
        }
        if (right.c >= thres) {
          right.x /= right.c;
          right.y /= right.c;
        } else {
          right.x = -1;
          right.y = -1;
        }
        return {
          left: left,
          center: center,
          right: right
        };
      };
      return worker.addEventListener('message', function(e) {
        var data, index, type, _ref;
        _ref = e.data, type = _ref.type, data = _ref.data, index = _ref.index;
        switch (type) {
          case 'process':
            return send(index, process(data));
        }
      });
    })(this);
  }

}).call(this);
