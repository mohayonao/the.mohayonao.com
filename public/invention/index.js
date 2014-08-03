(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $(function() {
    'use strict';
    var BPM, DancingPortrait, FPS, INVENTION_13, MMLTrack, MarkovMMLTrack, SoundSystem, ToneGenerator, famitable, i, main, sinetable, vue;
    BPM = 90;
    FPS = 60;
    INVENTION_13 = 'o3l16\nrea<c>beb<dc8e8>g+8<e8 >aea<c>beb<dc8>a8r4\n<rece>a<c>egf8a8<d8f8 fd>b<d>gbdfe8g8<c8e8\nec>a<c>f8<d8d>bgbe8<c8 c>afad8b8<c8r8r4\n\n>rg<ced>g<dfe8g8>b8<g8 c>g<ced>g<dfe8c8g8e8\n<c>aeace>a<c d8f+8a8<c8 >bgdg>b<d>gb<c8e8g8b8\naf+d+f+>b<d+>f+ag8<g8gece >a+8<f+8f+d>b<d>g8<e8ec>a<c\n>f+<gf+ed+f+>b<d+e8r8r4\nrgb-gegc+egec+e>arr8 <rfafdf>b<dfd>b<d>grr8\n<regece>a<cd+c>a<c>f+rr8 <rdfd>b<d>g+b<d>bg+berr8\n\nrea<c>beb<dc8>a8g+8e8 a<cec>a<c>f+a<c>af+ad+<c>ba\ng+b<d>bg+bdfg+fdf>b<fed ceaece>a<cd+c>a<c>f+<c>ba\ng+8<b8g+8e8rea<c>beb<d c>a<ced>b<dfecegfedc\n>b<cdefdg+dbdcafd>b<d >g+b<c>aeabg+aece>a4<\n;\no2l16\na8<a4g+8aea<c>beb<d c8>a8g+8e8aea<c>beb<d\nc8>a8<c8>a8<d>afadf>a<c >b8<d8g8b8bgegce>gb\na8<c8df>b<d>g8b8<ce>a<c >f8d8g<gfgcg<ced>g<df\n\ne8c8>b8g8 <c>g<ced>g<df e8c8r4rgegce>gb\na8<c8e8g8f+adf+>a<d>f+a g8b8<d8f+8egce>g<c>eg\nf+8a8b8<d+8rece>a<ceg f+d>b<d>gb<df+ec>a<c>f+a<c8\nc>b<c>ab8>b8<e<e>bge>bgb\ne8<e8g8b-8c+8r8r<gfe d8>d8f8a-8>b8r8r<<fed\nc8>c8e8f+8>a8r8r<<ed+c+ >b8>b8<d8f8>g+8r8r<<dc>b\n\n<c8>a8g+8e8aea<c>beb<d ceaece>a<c>f+a<c>af+ad+f+\ne8g+8b8g+8e8>b8g+8e8 a8<c8e8c8>a8<c8>d+8r8\nr>bg+edbgdc8e8>g+8<e8 >a8<f+8>b8<g+8c8a8d8b-8\ng+8f8d8>b8g+8a8d8e8 f8d+8e8<e8>a2';
    Array.prototype.randomchoice = function() {
      return this[(Math.random() * this.length) | 0];
    };
    sinetable = new Float32Array((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; _i < 32; i = ++_i) {
        _results.push(Math.sin(Math.PI * 2 * (i / 32)));
      }
      return _results;
    })());
    famitable = new Float32Array([+0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875, +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000, -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000, -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125]);
    DancingPortrait = (function() {
      var Cell, getImgData, getMosaic;

      Cell = (function() {
        function Cell(rgb, size, x, y, z) {
          this.rgb = rgb;
          this.size = size;
          this.x = x;
          this.y = y;
          this.z = z != null ? z : 0;
        }

        Cell.prototype.draw = function(ctx, dx, dy) {
          var rate, x, y;
          rate = this.z * 0.2;
          x = (this.x + dx * rate + 0.5) | 0;
          y = (this.y + dy * rate + 0.5) | 0;
          ctx.save();
          ctx.fillStyle = "rgb(" + this.rgb + ")";
          ctx.fillRect(x, y, this.size, this.size);
          return ctx.restore();
        };

        return Cell;

      })();

      function DancingPortrait(opts) {
        var c, d, dx, dy, x, y, _i, _j, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
        this.ctx = opts.canvas.getContext('2d');
        this.imgData = getImgData(opts.img);
        this.cellsize = (_ref = opts.cellsize) != null ? _ref : 3;
        this.mosaic = getMosaic(this.imgData, this.cellsize, this.cellsize);
        this.tile = (_ref1 = opts.tile) != null ? _ref1 : 4;
        this.cells = [];
        for (y = _i = 0, _ref2 = this.mosaic.height; _i < _ref2; y = _i += 1) {
          for (x = _j = 0, _ref3 = this.mosaic.width; _j < _ref3; x = _j += 1) {
            d = this.mosaic.data[y][x];
            c = new Cell("" + d.R + ", " + d.G + ", " + d.B, this.tile, x * this.tile, y * this.tile);
            dx = (this.mosaic.width / 2) - x;
            dy = (this.mosaic.height / 4) - y;
            c.z = -Math.sqrt(dx * dx + dy * dy);
            this.cells.push(c);
          }
        }
        this.cells.sort(function(a, b) {
          return a.z - b.z;
        });
        this.anime_prev = Date.now();
        _ref4 = [0, 0, 1.0], this.x_index = _ref4[0], this.x_speed = _ref4[1], this.x_rate = _ref4[2];
        _ref5 = [0, 0, 1.0], this.y_index = _ref5[0], this.y_speed = _ref5[1], this.y_rate = _ref5[2];
      }

      DancingPortrait.prototype.animate = function() {
        var ctx, dx, dy, elapsed, now;
        ctx = this.ctx;
        now = Date.now();
        elapsed = now - this.anime_prev;
        this.anime_prev = now;
        dx = this.x_index;
        dy = sinetable[this.y_index | 0] * this.y_rate;
        this.cells.forEach(function(cell) {
          return cell.draw(ctx, dx, dy);
        });
        this.y_index += this.y_speed * elapsed;
        if (this.y_index >= sinetable.length) {
          return this.y_index -= sinetable.length;
        }
      };

      getImgData = function(img) {
        var canvas, ctx;
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
      };

      getMosaic = function(imgData, w, h) {
        var average, cx, cy, x, y;
        average = function(x, y) {
          var B, G, R, _i, _j, _ref, _ref1, _ref2, _x, _y;
          _ref = [0, 0, 0], R = _ref[0], G = _ref[1], B = _ref[2];
          for (_y = _i = y, _ref1 = y + h; _i < _ref1; _y = _i += 1) {
            for (_x = _j = x, _ref2 = x + w; _j < _ref2; _x = _j += 1) {
              R += imgData.data[(imgData.width * _y + _x) * 4 + 0];
              G += imgData.data[(imgData.width * _y + _x) * 4 + 1];
              B += imgData.data[(imgData.width * _y + _x) * 4 + 2];
            }
          }
          return {
            B: (B / (w * h)) | 0,
            G: (G / (w * h)) | 0,
            R: (R / (w * h)) | 0,
            A: 255
          };
        };
        cx = (imgData.width / w) | 0;
        cy = (imgData.height / h) | 0;
        return {
          width: cx,
          height: cy,
          data: (function() {
            var _i, _results;
            _results = [];
            for (y = _i = 0; 0 <= cy ? _i < cy : _i > cy; y = 0 <= cy ? ++_i : --_i) {
              _results.push((function() {
                var _j, _results1;
                _results1 = [];
                for (x = _j = 0; 0 <= cx ? _j < cx : _j > cx; x = 0 <= cx ? ++_j : --_j) {
                  _results1.push(average(x * w, y * h));
                }
                return _results1;
              })());
            }
            return _results;
          })()
        };
      };

      return DancingPortrait;

    })();
    ToneGenerator = (function() {
      function ToneGenerator(opts) {
        var freq, _ref, _ref1, _ref2, _ref3;
        freq = 440 * Math.pow(2, (opts.noteIndex - 69) * 1 / 12);
        this.wavelet = (_ref = opts.wavelet) != null ? _ref : sinetable;
        this.volume = (_ref1 = opts.volume) != null ? _ref1 : 0.75;
        this.phase = (_ref2 = opts.phase) != null ? _ref2 : 0;
        this.phaseStep = freq * this.wavelet.length / pico.samplerate;
        this.duration = (_ref3 = opts.duration) != null ? _ref3 : 1000;
        this.volumeIncr = this.volume / (this.duration * 0.001 * pico.samplerate);
      }

      ToneGenerator.prototype.next = function(size) {
        var stream, _i;
        this.volume -= this.volumeIncr * size;
        if (this.volume <= 0) {
          this.volume = 0;
        }
        stream = new Float32Array(size);
        for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
          stream[i] = this.wavelet[(this.phase | 0) % this.wavelet.length] * this.volume;
          this.phase += this.phaseStep;
        }
        return stream;
      };

      return ToneGenerator;

    })();
    MMLTrack = (function() {
      var compile;

      function MMLTrack(opts) {
        var _ref, _ref1;
        this.originData = opts.mml;
        this.samplerate = pico.samplerate;
        this.vol = (_ref = opts.vol) != null ? _ref : 0.5;
        this.bpm = (_ref1 = opts.bpm) != null ? _ref1 : 120;
        this.shift = opts.shift;
        this.index = 0;
        this.finished = false;
        this.noteCounterMax = 0;
        this.noteCounter = 0;
        this.gens = [];
        this.data = compile(this.originData);
      }

      MMLTrack.prototype.nextTones = function() {
        var res;
        res = this.data[this.index++];
        if (res != null) {
          return [res];
        } else {
          return null;
        }
      };

      MMLTrack.prototype.next = function(size) {
        var cell, d, g, gen, gens, j, lis, noteCounter, noteCounterMax, opts, samples, streamcell, vol, _i, _j, _k, _len, _len1, _ref, _ref1;
        _ref = [this.noteCounter, this.noteCounterMax], noteCounter = _ref[0], noteCounterMax = _ref[1];
        _ref1 = [this.gens, this.vol], gens = _ref1[0], vol = _ref1[1];
        cell = new Float32Array(size);
        noteCounter -= size;
        if (noteCounter <= 0) {
          if ((lis = this.nextTones()) != null) {
            for (_i = 0, _len = lis.length; _i < _len; _i++) {
              d = lis[_i];
              if (d.noteIndex !== -1) {
                opts = {
                  size: size,
                  noteIndex: d.noteIndex + this.shift,
                  duration: 500,
                  volume: d.velocity / 15,
                  wavelet: famitable
                };
                g = new ToneGenerator(opts);
                gens.push(g);
              }
            }
            samples = (60 / this.bpm) * this.samplerate * (4 / d.length);
            noteCounter += samples;
          } else {
            this.index = 0;
            noteCounter = noteCounterMax;
          }
        }
        for (_j = 0, _len1 = gens.length; _j < _len1; _j++) {
          gen = gens[_j];
          streamcell = gen.next(size);
          for (j = _k = 0; 0 <= size ? _k < size : _k > size; j = 0 <= size ? ++_k : --_k) {
            cell[j] += streamcell[j] * vol;
          }
        }
        this.gens = gens.filter(function(x) {
          return x.volume > 0;
        });
        this.noteCounter = noteCounter;
        return cell;
      };

      compile = function(data) {
        var L, O, S, TONES, V, cmd, length, noteIndex, r, sign, t, val, x, _ref, _ref1, _ref2, _results;
        _ref = [3, 8, 12], O = _ref[0], L = _ref[1], V = _ref[2];
        TONES = {
          c: 0,
          d: 2,
          e: 4,
          f: 5,
          g: 7,
          a: 9,
          b: 11
        };
        S = {
          "-": -1,
          "+": +1
        };
        r = /([cdefgabrolv<>])([-+]?)(\d*)/gm;
        _results = [];
        while ((x = r.exec(data.toLowerCase())) != null) {
          _ref1 = x.slice(1, 4), cmd = _ref1[0], sign = _ref1[1], val = _ref1[2];
          t = null;
          switch (cmd) {
            case "o":
              if (val !== "") {
                O = Number(val);
              }
              break;
            case "l":
              if (val !== "") {
                L = Number(val);
              }
              break;
            case "v":
              if (val !== "") {
                V = Number(val);
              }
              break;
            case "<":
              if (O < 8) {
                O += 1;
              }
              break;
            case ">":
              if (O > 1) {
                O -= 1;
              }
              break;
            case "r":
              t = -1;
              break;
            default:
              t = TONES[cmd];
          }
          switch (t) {
            case null:
              continue;
            case -1:
              noteIndex = -1;
              break;
            default:
              noteIndex = O * 12 + t + 36 + ((_ref2 = S[sign]) != null ? _ref2 : 0);
          }
          length = val === "" ? L : Number(val);
          _results.push({
            noteIndex: noteIndex,
            length: length,
            velocity: V
          });
        }
        return _results;
      };

      return MMLTrack;

    })();
    MarkovMMLTrack = (function(_super) {
      __extends(MarkovMMLTrack, _super);

      function MarkovMMLTrack(player, options) {
        var _ref;
        if (options == null) {
          options = {};
        }
        MarkovMMLTrack.__super__.constructor.call(this, player, options);
        this.lv = (_ref = options.lv) != null ? _ref : 3;
        this.markov = {};
        this.chord = {};
        this.histNoteIndex = [];
        this.prevNoteIndex = 0;
        this.index = 0;
        this.readIndex = 0;
        this.velocity = 12;
        this.makeMarkovData(this.lv);
      }

      MarkovMMLTrack.prototype.nextTones = function() {
        var histNoteIndex, key, lv, noteIndex, noteIndexCands, noteLengthCands, subNoteIndex, _i, _ref, _ref1, _ref2, _ref3;
        _ref = [null, null], noteIndexCands = _ref[0], noteLengthCands = _ref[1];
        _ref1 = [this.lv, this.histNoteIndex], lv = _ref1[0], histNoteIndex = _ref1[1];
        for (i = _i = 0; 0 <= lv ? _i < lv : _i > lv; i = 0 <= lv ? ++_i : --_i) {
          key = histNoteIndex.slice(i, lv).join(",");
          if ((noteIndexCands = this.markov[key]) != null) {
            break;
          }
        }
        if (noteIndexCands != null) {
          noteIndex = noteIndexCands.randomchoice();
        } else {
          noteIndex = this.data[this.readIndex++].noteIndex;
          if (this.readIndex >= this.data.length) {
            this.index = 0;
          }
        }
        histNoteIndex.push(noteIndex);
        if (histNoteIndex.length > lv) {
          histNoteIndex.shift();
        }
        this.histNoteIndex = histNoteIndex;
        if (this.prevNoteIndex === noteIndex) {
          this.velocity -= 2;
          if (this.velocity <= 0) {
            this.velocity = 12;
            this.histNoteIndex = [];
          }
        } else {
          this.velocity = 12;
          this.prevNoteIndex = noteIndex;
        }
        subNoteIndex = (_ref2 = (_ref3 = this.chord[noteIndex]) != null ? _ref3.randomchoice() : void 0) != null ? _ref2 : -1;
        return [
          {
            noteIndex: noteIndex,
            length: this.minLength,
            velocity: this.velocity
          }, {
            noteIndex: subNoteIndex,
            length: this.minLength,
            velocity: 4
          }
        ];
      };

      MarkovMMLTrack.prototype.makeMarkovData = function(lv) {
        var data, make, markov, _i;
        if (lv == null) {
          lv = 2;
        }
        this.minLength = this.data.map(function(x) {
          return x.length;
        }).reduce(function(a, b) {
          return Math.max(a, b);
        });
        data = (function(_this) {
          return function() {
            var d, lis, noteIndex, prev, _i, _j, _len, _ref, _ref1, _ref2;
            _ref = [[], null], lis = _ref[0], prev = _ref[1];
            _ref1 = _this.data;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              d = _ref1[_i];
              if (d.noteIndex === -1) {
                if (prev == null) {
                  continue;
                }
                noteIndex = prev;
              } else {
                noteIndex = d.noteIndex;
              }
              for (i = _j = 0, _ref2 = _this.minLength / d.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
                lis.push({
                  noteIndex: noteIndex,
                  length: _this.minLength
                });
              }
            }
            return lis;
          };
        })(this)();
        make = (function(_this) {
          return function(dst, lv) {
            var d, key, lis, _i, _len, _results;
            lis = [];
            _results = [];
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              d = data[_i];
              if (lis.length === lv) {
                key = lis.map(function(x) {
                  return x.noteIndex;
                }).join(",");
                (dst[key] != null ? dst[key] : dst[key] = []).push(d.noteIndex);
              }
              lis.push(d);
              if (lis.length > lv) {
                _results.push(lis.shift());
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
        })(this);
        markov = {};
        for (i = _i = 1; 1 <= lv ? _i <= lv : _i >= lv; i = 1 <= lv ? ++_i : --_i) {
          make(markov, i);
        }
        return this.markov = markov;
      };

      MarkovMMLTrack.prototype.makeChord = function(others) {
        var a, b, chord, pair, zip, _i, _len, _ref;
        zip = function() {
          var argumentLength, arr, length, lengthArray, results, semiResult, _i, _j, _len;
          lengthArray = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = arguments.length; _i < _len; _i++) {
              arr = arguments[_i];
              _results.push(arr.length);
            }
            return _results;
          }).apply(this, arguments);
          length = Math.max.apply(Math, lengthArray);
          argumentLength = arguments.length;
          results = [];
          for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
            semiResult = [];
            for (_j = 0, _len = arguments.length; _j < _len; _j++) {
              arr = arguments[_j];
              semiResult.push(arr[i]);
            }
            results.push(semiResult);
          }
          return results;
        };
        chord = {};
        _ref = zip(this.data, others.data);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pair = _ref[_i];
          if ((pair[0] == null) || (pair[1] == null)) {
            break;
          }
          a = pair[0].noteIndex;
          b = pair[1].noteIndex;
          if (a !== -1 && b !== -1) {
            b = a - ((a - b) % 12);
          }
          (chord[a] != null ? chord[a] : chord[a] = []).push(b);
        }
        return this.chord = chord;
      };

      return MarkovMMLTrack;

    })(MMLTrack);
    SoundSystem = (function() {
      function SoundSystem() {
        this.efx = new Reverb(44100, 128);
      }

      SoundSystem.prototype.setMML = function(mml) {
        var t0, t1, t2, t3, v;
        v = mml.split(';');
        t0 = new MMLTrack({
          mml: v[0],
          bpm: BPM,
          shift: 0
        });
        t1 = new MMLTrack({
          mml: v[1],
          bpm: BPM,
          shift: -12
        });
        t2 = new MarkovMMLTrack({
          mml: v[0],
          bpm: BPM,
          shift: 0
        });
        t3 = new MarkovMMLTrack({
          mml: v[1],
          bpm: BPM,
          shift: 0
        });
        t2.makeChord(t3);
        this.normalTracks = [t0, t1];
        return this.markovTrack = [t2];
      };

      SoundSystem.prototype.setMode = function(mode) {
        switch (mode) {
          case 'markov':
            this.mmlTracks = this.markovTrack;
            return this.efx.wet = 0.75;
          default:
            this.mmlTracks = this.normalTracks;
            return this.efx.wet = 0.25;
        }
      };

      SoundSystem.prototype.setEfxDepth = function(depth) {
        depth = Math.max(0, Math.min(depth, 1));
        return this.efx.setRoomSize(depth);
      };

      SoundSystem.prototype.play = function() {
        if (!pico.isPlaying) {
          return pico.play(this);
        }
      };

      SoundSystem.prototype.pause = function() {
        if (pico.isPlaying) {
          return pico.pause();
        }
      };

      SoundSystem.prototype.toggle = function() {
        if (pico.isPlaying) {
          pico.pause();
          return false;
        } else {
          pico.play(this);
          return true;
        }
      };

      SoundSystem.prototype.process = function(L, R) {
        var cell, mml, mmlTracks, _i, _j, _k, _len, _ref, _ref1;
        mmlTracks = this.mmlTracks;
        for (i = _i = 0, _ref = L.length; _i < _ref; i = _i += 1) {
          L[i] = R[i] = 0;
        }
        for (_j = 0, _len = mmlTracks.length; _j < _len; _j++) {
          mml = mmlTracks[_j];
          cell = mml.next(L.length);
          for (i = _k = 0, _ref1 = L.length; _k < _ref1; i = _k += 1) {
            L[i] = (R[i] += cell[i]);
          }
        }
        this.mmlTracks = mmlTracks.filter(function(x) {
          return !x.finished;
        });
        if (this.mmlTracks.length === 0) {
          if (this.readEnd) {
            this.pause();
          } else {
            this.readEnd = true;
          }
        }
        return this.efx.process(L, R);
      };

      return SoundSystem;

    })();
    vue = new Vue({
      el: '#app',
      data: {
        mode: 'normal'
      }
    });
    main = function(img) {
      var $canvas, animate, canvas, height, isAnimate, portrait, sys, width;
      $canvas = $(canvas = document.getElementById('canvas'));
      width = canvas.width = $canvas.width();
      height = canvas.height = $canvas.height();
      portrait = new DancingPortrait({
        img: img,
        canvas: canvas
      });
      portrait.y_speed = (sinetable.length * BPM * 2) / (60 * 1000);
      isAnimate = false;
      animate = function() {
        portrait.animate();
        if (isAnimate) {
          return requestAnimationFrame(animate);
        }
      };
      sys = new SoundSystem;
      sys.setMML(INVENTION_13);
      $canvas.on('click', function(e) {
        var mode;
        mode = vue.mode;
        sys.setMode(mode);
        if (sys.toggle()) {
          $canvas.css({
            opacity: 1.0
          });
          if (mode === 'markov') {
            isAnimate = true;
            return requestAnimationFrame(animate);
          }
        } else {
          $canvas.css({
            opacity: 0.5
          });
          return isAnimate = false;
        }
      });
      $canvas.on('mousemove', function(e) {
        var offset, x, x_rate, y, y_rate;
        offset = $canvas.offset();
        x = e.pageX - offset.left;
        y = e.pageY - offset.top;
        x_rate = x / width;
        y_rate = y / height;
        sys.setEfxDepth(1.0 - y_rate);
        portrait.y_rate = (1.0 - y_rate) * 3.0 + 0.25;
        return portrait.x_index = (x_rate - 0.5) * 5;
      });
      return animate();
    };
    return $('<img>').attr('src', '/invention/bach.png').load(function(e) {
      return main(e.target);
    });
  });

}).call(this);
