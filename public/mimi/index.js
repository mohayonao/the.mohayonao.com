(function() {
  $(function() {
    'use strict';
    var App, BitmapView, FileStepLoader, SoundTrack, app;

    $(window).on('dragover', function() {
      return false;
    });
    $(window).on('drop', function(e) {
      if (app) {
        app.play(e.originalEvent.dataTransfer.files[0]);
      }
      return false;
    });
    $(window).on('keydown', function(e) {
      switch (e.keyCode) {
        case 32:
          app.pause();
          return false;
      }
    });
    FileStepLoader = (function() {
      function FileStepLoader() {
        this._readBytes = 512;
        this._fetchBytes = 128;
        this._buffers = [];
        this._bufferReadIndex = 0;
        this._file = null;
        this._fileReadIndex = 0;
        this._mutex = 0;
        this._reset = false;
        this._noneArray = new Uint8Array(this._readBytes);
        this._currentBuffer = this._noneArray;
      }

      FileStepLoader.prototype.set = function(file, cb) {
        var _this = this;

        this._file = file;
        this._file.slice = file.slice || file.webkitSlice || file.mozSlice;
        this._mutex = 0;
        this._buffers.splice(0);
        this._reset = true;
        return this.fileread(function() {
          _this._bufferReadIndex = 0;
          return typeof cb === "function" ? cb() : void 0;
        });
      };

      FileStepLoader.prototype.fileread = function(cb) {
        var begin, blob, end, reader, size,
          _this = this;

        if (this._mutex !== 0) {
          return;
        }
        this._mutex = 1;
        size = this._readBytes;
        begin = this._reset ? 0 : this._fileReadIndex;
        end = begin + size;
        blob = this._file.slice(begin, end);
        this._fileReadIndex = end;
        reader = new FileReader;
        reader.onload = function(e) {
          var buffer, i, result, _i, _ref;

          result = e.target.result;
          buffer = new Uint8Array(size);
          for (i = _i = 0, _ref = result.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            buffer[i] = result.charCodeAt(i);
          }
          _this._buffers.push(buffer);
          _this._mutex = 0;
          return typeof cb === "function" ? cb() : void 0;
        };
        reader.readAsBinaryString(blob);
        return this._reset = false;
      };

      FileStepLoader.prototype.fetch = function() {
        var begin, buffer, end;

        begin = this._bufferReadIndex;
        end = begin + this._fetchBytes;
        this._bufferReadIndex = end;
        buffer = this._currentBuffer.subarray(begin, end);
        if (this._readBytes <= end) {
          this._currentBuffer = this._buffers.shift() || this._noneArray;
          this._bufferReadIndex = 0;
        } else {
          this.fileread();
        }
        return buffer;
      };

      return FileStepLoader;

    })();
    BitmapView = (function() {
      function BitmapView(canvas, opts) {
        var i, _i, _ref;

        this._canvas = canvas;
        this.width = canvas.width = opts.width;
        this.height = canvas.height = opts.height;
        this._context = canvas.getContext('2d');
        this._imagedata = this._context.getImageData(0, 0, this.width, this.height);
        for (i = _i = 0, _ref = this._imagedata.data.length; _i < _ref; i = _i += 1) {
          this._imagedata.data[i] = 255;
        }
      }

      BitmapView.prototype.set = function(bytes) {
        var data, i, j, widthStep, x, _i, _j, _ref, _ref1;

        data = this._imagedata.data;
        widthStep = this.width * 4;
        for (i = _i = 0, _ref = data.length - widthStep; _i < _ref; i = _i += 1) {
          data[i] = data[i + widthStep];
        }
        j = i;
        for (i = _j = 0, _ref1 = bytes.length; _j < _ref1; i = _j += 1) {
          x = bytes[i];
          switch (false) {
            case x !== 0x00:
              data[j++] = 0xff;
              data[j++] = 0xff;
              data[j++] = 0xff;
              break;
            case !(x <= 0x1f):
              data[j++] = 0x33;
              data[j++] = 0xff;
              data[j++] = 0xff;
              break;
            case !(x <= 0x7f):
              data[j++] = 0xff;
              data[j++] = 0x33;
              data[j++] = 0x33;
              break;
            default:
              data[j++] = 0x00;
              data[j++] = 0x00;
              data[j++] = 0x33;
          }
          j++;
        }
        return this._context.putImageData(this._imagedata, 0, 0);
      };

      return BitmapView;

    })();
    SoundTrack = (function() {
      function SoundTrack() {
        this._func = function(t) {
          return 0;
        };
        this._t = 0;
      }

      SoundTrack.prototype.set = function(bytes) {
        return this._func = function(t) {
          return bytes[t & 127];
        };
      };

      SoundTrack.prototype.process = function(L, R) {
        var f, i, t, _i, _ref, _ref1;

        _ref = [this._func, this._t], f = _ref[0], t = _ref[1];
        for (i = _i = 0, _ref1 = L.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          L[i] = R[i] = ((f(t) & 0xff) * 0.0078125 - 0.5) * 0.5;
          t += 0.25;
        }
        return this._t = t;
      };

      return SoundTrack;

    })();
    App = (function() {
      function App(elem) {
        this._stepLoader = new FileStepLoader;
        this._view = new BitmapView(elem, {
          width: 128,
          height: 64
        });
        this._sound = new SoundTrack;
        this._filter = new Biquad(44100);
        this._amp = 1;
        this._sampleCount = 0;
        this._sampleCountMax = 1024;
        this._filter.setType('lowshelf');
        this._filter.setParams(2400, 0, 12);
        this.setBPM(180);
      }

      App.prototype.play = function(file) {
        var _this = this;

        this._stepLoader.set(file, function() {
          _this._amp = 1;
          _this._sampleCount = 0;
          return pico.play(_this);
        });
        return $('#tips').text('press [SPACE] to pause');
      };

      App.prototype.pause = function() {
        pico.pause();
        return $('#tips').text('drag a file to play');
      };

      App.prototype.setBPM = function(bpm) {
        this._bpm = bpm;
        return this._sampleCountMax = (60 / bpm) * pico.samplerate * (4 / 16);
      };

      App.prototype.process = function(L, R) {
        var bytes;

        if (this._sampleCount <= 0) {
          bytes = this._stepLoader.fetch();
          this._sound.set(bytes);
          this._view.set(bytes);
          this._sampleCount += this._sampleCountMax;
        }
        this._sampleCount -= 128;
        this._sound.process(L, R);
        return this._filter.process(L, R);
      };

      return App;

    })();
    return app = new App(document.getElementById('preview'));
  });

}).call(this);
