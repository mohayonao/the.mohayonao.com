(function() {
  $(function() {
    'use strict';
    var App, AudioProcessor, GlitchProcessor, PREVIEW_HEIGHT, PREVIEW_WIDTH, VideoProcessor, app;
    PREVIEW_WIDTH = 480;
    PREVIEW_HEIGHT = 360;
    app = null;
    $(window).on('dragover', function() {
      return false;
    });
    $(window).on('drop', function(e) {
      if (app && createObjectURL) {
        $('#tips').hide();
        app.setFiles(e.originalEvent.dataTransfer.files);
      }
      return false;
    });
    if (!AudioContext) {
      return;
    }
    if (!createObjectURL) {
      return;
    }
    if (!requestAnimationFrame) {
      return;
    }
    $('#play').on('click', function() {
      return app.play();
    });
    $('#pause').on('click', function() {
      return app.pause();
    });
    App = (function() {
      function App() {
        this.processors = [];
        this.files = [];
        this.filesIndex = 0;
        this.video = null;
        this.loop = false;
        this.isPlaying = false;
      }

      App.prototype.setFiles = function(files, callbcak) {
        this.pause();
        this.files = files;
        this.filesIndex = 0;
        this.video = null;
        return this.next();
      };

      App.prototype.next = function(index) {
        var file, type, video;
        if (typeof index === 'number' && index >= 0) {
          this.filesIndex = index;
        }
        if (this.filesIndex >= this.files.length) {
          if (this.video && this.loop && this.isPlaying) {
            this.next(0);
          }
          return;
        }
        file = this.files[this.filesIndex++];
        type = file.type.substr(0, 5);
        video = document.createElement('video');
        if (type === 'video' && video.canPlayType(file.type)) {
          $(video).on('loadeddata', (function(_this) {
            return function() {
              video.currentTime = 0;
              video.muted = false;
              video.volume = 0.1;
              _this.processors.forEach(function(x) {
                return x.init(video);
              });
              return _this.play();
            };
          })(this));
          $(video).on('seeked', (function(_this) {
            return function() {
              if (video.paused) {
                return _this.processors.forEach(function(x) {
                  return x.process();
                });
              }
            };
          })(this));
          $(video).on('ended', (function(_this) {
            return function() {
              return _this.next();
            };
          })(this));
          video.type = file.type;
          video.src = createObjectURL(file);
          return this.video = video;
        } else {
          return this.next();
        }
      };

      App.prototype.addProcessor = function(processor) {
        return this.processors.push(processor);
      };

      App.prototype.addSubProcessor = function(processor) {
        return this.processors.forEach(function(x) {
          return x.subProcessor = processor;
        });
      };

      App.prototype.setCurrentTime = function(rate) {
        var _ref;
        return (_ref = this.video) != null ? _ref.currentTime = this.video.duration * rate : void 0;
      };

      App.prototype.setProcessing = function(val) {
        return this.processors.forEach(function(x) {
          return x.processing = val;
        });
      };

      App.prototype.fullScreen = function() {
        if (!this.video.paused) {
          return this.processors.forEach(function(x) {
            return typeof x.fullScreen === "function" ? x.fullScreen() : void 0;
          });
        }
      };

      App.prototype.play = function() {
        var _ref;
        this.isPlaying = true;
        return (_ref = this.video) != null ? _ref.play() : void 0;
      };

      App.prototype.pause = function() {
        var _ref;
        this.isPlaying = false;
        return (_ref = this.video) != null ? _ref.pause() : void 0;
      };

      return App;

    })();
    VideoProcessor = (function() {
      function VideoProcessor(target) {
        this.subProcessor = null;
        this.target = target;
        this.context = target.getContext('2d');
        this.canvas = document.createElement('canvas');
        this.canvas.context = this.canvas.getContext('2d');
        this.target.width = this.canvas.width = PREVIEW_WIDTH;
        this.target.height = this.canvas.height = PREVIEW_HEIGHT;
        this.processing = true;
        this.prevProcess = 0;
      }

      VideoProcessor.prototype.init = function(video) {
        var $video, ch, cw, h, vh, vw, w, _ref, _ref1, _ref2, _ref3, _ref4;
        $video = $(video);
        $video.on('play', (function(_this) {
          return function() {
            return _this.play();
          };
        })(this));
        $video.on('pause', (function(_this) {
          return function() {
            return _this.pause();
          };
        })(this));
        $video.on('timeupdate', (function(_this) {
          return function() {
            return $('#currentTime').val((video.currentTime / video.duration) * 10000);
          };
        })(this));
        _ref = [video.videoWidth, video.videoHeight], vw = _ref[0], vh = _ref[1];
        _ref1 = [this.canvas.width, this.canvas.height], cw = _ref1[0], ch = _ref1[1];
        if (vw > vh) {
          h = cw * (vh / vw);
          _ref2 = [0, (ch - h) * 0.5, cw, h], this.dx = _ref2[0], this.dy = _ref2[1], this.dw = _ref2[2], this.dh = _ref2[3];
        } else {
          w = ch * (vw / vh);
          _ref3 = [(cw - w) * 0.5, 0, w, ch], this.dx = _ref3[0], this.dy = _ref3[1], this.dw = _ref3[2], this.dh = _ref3[3];
        }
        _ref4 = [0, 0, vw, vh], this.sx = _ref4[0], this.sy = _ref4[1], this.sw = _ref4[2], this.sh = _ref4[3];
        this.canvas.context.clearRect(0, 0, cw, ch);
        return this.video = video;
      };

      VideoProcessor.prototype.play = function() {
        this.isPaused = false;
        return requestAnimationFrame((function(_this) {
          return function() {
            return _this.process();
          };
        })(this));
      };

      VideoProcessor.prototype.pause = function() {
        return this.isPaused = true;
      };

      VideoProcessor.prototype.process = function() {
        var binary, img, now, src;
        now = Date.now();
        if (now - this.prevProcess > 60) {
          this.prevProcess = now;
          this.canvas.context.drawImage(this.video, this.sx, this.sy, this.sw, this.sh, this.dx, this.dy, this.dw, this.dh);
          src = this.canvas.toDataURL('image/jpeg');
          if (this.processing && this.subProcessor) {
            binary = this.subProcessor.videoProcess(atob(src.replace(/^.*,/, '')));
            src = [
              'data:image/jpeg;base64,', btoa(binary.replace(/[\u0100-\uffff]/g, function(c) {
                return String.fromCharCode(c.charCodeAt(0) & 0xff);
              }))
            ].join('');
          }
          img = new Image;
          img.onload = (function(_this) {
            return function() {
              return _this.context.drawImage(img, 0, 0);
            };
          })(this);
          img.src = src;
        }
        if (!this.isPaused) {
          return requestAnimationFrame((function(_this) {
            return function() {
              return _this.process();
            };
          })(this));
        }
      };

      VideoProcessor.prototype.fullScreen = function() {
        return this.target.webkitRequestFullScreen();
      };

      return VideoProcessor;

    })();
    AudioProcessor = (function() {
      function AudioProcessor(target) {
        this.subProcessor = null;
        this.target = target;
        this.stream = new Float32Array(1024);
        this.processing = true;
        this.isPlaying = false;
      }

      AudioProcessor.prototype.init = function(video) {
        var $video, gain, media, node, _ref;
        if (this.isPlaying) {
          this.pause();
        }
        $video = $(video);
        $video.on('play', (function(_this) {
          return function() {
            return _this.play();
          };
        })(this));
        $video.on('pause', (function(_this) {
          return function() {
            return _this.pause();
          };
        })(this));
        media = this.target.createMediaElementSource(video);
        gain = this.target.createGain();
        gain.gain.value = 1.5;
        node = this.target.createScriptProcessor(1024, 2, 2);
        node.onaudioprocess = this.process.bind(this);
        media.connect(gain);
        media.connect(node);
        return _ref = [node, gain, video], this.node = _ref[0], this.gain = _ref[1], this.video = _ref[2], _ref;
      };

      AudioProcessor.prototype.play = function() {
        this.gain.connect(this.target.destination);
        this.node.connect(this.target.destination);
        return this.isPlaying = true;
      };

      AudioProcessor.prototype.pause = function() {
        this.node.disconnect();
        this.gain.disconnect();
        return this.isPlaying = false;
      };

      AudioProcessor.prototype.process = function(e) {
        var L, R, i, stream, _i, _j, _ref, _ref1, _results;
        if (!e) {
          return;
        }
        stream = this.stream;
        L = e.inputBuffer.getChannelData(0);
        R = e.inputBuffer.getChannelData(1);
        for (i = _i = 0, _ref = L.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          stream[i] = (L[i] + R[i]) * 4;
        }
        if (this.processing && this.subProcessor) {
          stream = this.subProcessor.audioProcess(stream);
        }
        L = e.outputBuffer.getChannelData(0);
        R = e.outputBuffer.getChannelData(1);
        _results = [];
        for (i = _j = 0, _ref1 = L.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          _results.push(L[i] = R[i] = stream[i]);
        }
        return _results;
      };

      return AudioProcessor;

    })();
    GlitchProcessor = (function() {
      function GlitchProcessor() {
        this.mode = 0;
        this.level = 0.2;
      }

      GlitchProcessor.prototype.videoProcess = (function() {
        var i, randint, randtable;
        i = 0;
        randint = function(a, b) {
          return ((Math.random() * (b - a + 1)) + 1) | 0;
        };
        randtable = new Uint8Array((function() {
          var _i, _results;
          _results = [];
          for (i = _i = 0; _i < 4096; i = ++_i) {
            _results.push(randint(0, 9));
          }
          return _results;
        })());
        return function(src) {
          if (this.mode === 3) {
            return src.replace(/0/ig, function(c) {
              return String.fromCharCode(48 + randtable[i++ & 4095]);
            });
          } else if (Math.random() < 0.5) {
            return src.replace(/0/ig, function(c) {
              if (Math.random() < 0.02) {
                return String.fromCharCode(48 + randtable[i++ & 4095]);
              } else {
                return c;
              }
            });
          } else {
            return src;
          }
        };
      })();

      GlitchProcessor.prototype.audioProcess = function(stream) {
        var glitchbuffer, i, _i, _ref;
        if (this.mode === 0 && Math.random() < this.level) {
          this.mode = 1;
        }
        if (this.mode === 1) {
          this.mode = 2;
          this.glitchbuffer = [];
          this.glitchbufferLength = ((Math.random() * 4) | 0) + 1;
        }
        if (this.mode === 2) {
          this.glitchbuffer.push(new Float32Array(stream));
          if (this.glitchbuffer.length === this.glitchbufferLength) {
            this.mode = 3;
            this.glitchindex = 0;
            this.glitchindexMax = (((Math.random() * 18) | 0) * 2) + 2;
          }
        }
        if (this.mode === 3) {
          glitchbuffer = this.glitchbuffer[this.glitchindex % this.glitchbufferLength];
          for (i = _i = 0, _ref = stream.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            stream[i] = glitchbuffer[i];
          }
          this.glitchindex += 1;
          if (this.glitchindex === this.glitchindexMax) {
            this.mode = 4;
          }
        }
        if (this.mode === 4) {
          this.glitchindex -= 1;
          if (this.glitchindex === 0) {
            this.mode = 0;
          }
        }
        return stream;
      };

      return GlitchProcessor;

    })();
    app = new App;
    app.addProcessor(new VideoProcessor(document.getElementById('canvas')));
    app.addProcessor(new AudioProcessor(new AudioContext));
    return app.addSubProcessor(new GlitchProcessor());
  });

}).call(this);
