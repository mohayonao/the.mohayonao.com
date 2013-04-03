(function() {
  'use strict';
  var Sequencer, Timeline,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Timeline = (function(_super) {
    var fetch;

    __extends(Timeline, _super);

    function Timeline(_args) {
      Timeline.__super__.constructor.call(this, 1, _args);
      timbre.fn.timer(this);
      timbre.fn.fixKR(this);
    }

    Timeline.prototype.reset = function() {
      this.bpm = 120;
      this.shuffle = false;
      this.stroke = ['D-u-'];
      this.currentcmd = null;
      this.loopIgnore = false;
      this.codaIgnore = false;
      this.repeat = false;
      this.loopStack = [
        {
          index: 0,
          maxCount: 2,
          count: 1
        }
      ];
      this.segnoIndex = 0;
      this.samples = 0;
      this.samplesMax = 0;
      this.samplesCount = 0;
      this.setBpm(this.bpm);
      this.i1 = 0;
      this.i2 = this.stroke.length;
      return this.i3 = this.stroke[this.i2 % this.stroke.length].length;
    };

    Timeline.prototype.setList = function(list) {
      var cmd, i, prev, stroke, _i, _j, _ref, _ref1;

      this.list = list;
      for (i = _i = 0, _ref = this.list.length; _i < _ref; i = _i += 1) {
        cmd = this.list[i];
        if (cmd.type === '!') {
          if (cmd.stroke) {
            stroke = cmd.stroke;
            prev = '';
            for (i = _j = 0, _ref1 = stroke.length; _j < _ref1; i = _j += 1) {
              stroke[i] = stroke[i].replace(/_/g, '');
              if (stroke[i] === '=') {
                stroke[i] = prev;
              }
              prev = stroke[i];
            }
            cmd.stroke = stroke;
          }
        }
      }
      console.log(this.list);
      return this.reset();
    };

    Timeline.prototype.setBpm = function(bpm) {
      this.bpm = bpm;
      if (this.shuffle) {
        this.samplesMax = timbre.timevalue("bpm" + this.bpm + " l12");
      } else {
        this.samplesMax = timbre.timevalue("bpm" + this.bpm + " l8");
      }
      this.samplesMax = this.samplesMax * timbre.samplerate * 0.001;
      return this.i2 = this.i3 = 0;
    };

    Timeline.prototype.process = function(tickID) {
      var f, s;

      if (this.samples <= 0) {
        if (!this.shuffle || this.samplesCount % 3 !== 1) {
          if (this.i3 >= this.stroke[this.i2 % this.stroke.length].length) {
            this.i3 = 0;
            this.i2 += 1;
            this.currentcmd = fetch.call(this);
          }
          if (this.currentcmd === null) {
            return this.eof();
          }
          f = this.currentcmd.form;
          s = this.stroke[this.i2 % this.stroke.length].charAt(this.i3++);
          if (s !== '-') {
            this.callback(f, s);
          }
        }
        this.samples += this.samplesMax;
        this.samplesCount += 1;
      }
      this.samples -= this._.cellsize;
      return this;
    };

    fetch = function() {
      var cmd, count, lop;

      cmd = this.list[this.i1++];
      if (!cmd) {
        return null;
      }
      if ((cmd.type === '#' || cmd.type === '=') && !this.loopIgnore && !this.codaIgnore) {
        return cmd;
      }
      if (this.codaIgnore && cmd.type !== '*') {
        return fetch.call(this);
      }
      switch (cmd.type) {
        case '|:':
          this.loopStack.push({
            index: this.i1,
            maxCount: 2,
            count: 1
          });
          break;
        case ':|':
          lop = this.loopStack[this.loopStack.length - 1];
          this.loopIgnore = false;
          if (lop) {
            if (lop.count < lop.maxCount) {
              lop.count += 1;
              this.i1 = lop.index;
            } else {
              this.loopStack.pop();
            }
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          lop = this.loopStack[this.loopStack.length - 1];
          if (lop) {
            count = +cmd.type;
            this.loopIgnore = lop.count !== count;
            if (lop.maxCount < count) {
              lop.maxCount = count;
            }
          }
          break;
        case '$':
          this.segnoIndex = this.i1;
          break;
        case '*':
          if (this.repeat) {
            this.codaIgnore = !this.codaIgnore;
          }
          break;
        case '<':
          if (!repeat) {
            this.repeat = true;
            this.i1 = this.segnoIndex;
          }
          break;
        case '^':
          if (this.repeat) {
            return null;
          }
          break;
        case '!':
          if (cmd.bpm) {
            this.bpm = cmd.bpm;
          }
          if (cmd.shuffle) {
            this.shuffle = cmd.shuffle;
          }
          if (cmd.stroke) {
            this.stroke = cmd.stroke;
          }
          this.setBpm(this.bpm);
      }
      return fetch.call(this);
    };

    return Timeline;

  })(timbre.Object);

  timbre.fn.register('lelenofu-timeline', Timeline);

  Sequencer = (function() {
    var sched_pluck;

    function Sequencer() {
      var _this = this;

      this.tl = T('lelenofu-timeline');
      this.tl.callback = this.pluck.bind(this);
      this.tl.eof = function() {
        return typeof _this.eof === "function" ? _this.eof() : void 0;
      };
      this.sched = T('schedule');
      this.midicps = T('midicps');
      this.send = T('lpf', {
        freq: 2800,
        Q: 4,
        mul: 0.6
      });
      this.master = T('delay', {
        time: 120,
        fb: 0.6,
        mix: 0.15
      }, this.send);
    }

    Sequencer.prototype.pluck = function(form, stroke) {
      var delay, freq, i, mul, mute, volume, _i;

      form = [69 + (form.charAt(0) | 0), 64 + (form.charAt(1) | 0), 60 + (form.charAt(2) | 0), 67 + (form.charAt(3) | 0)];
      switch (stroke) {
        case 'x':
          form = volume = delay = [0, 0, 0, 0];
          mute = true;
          break;
        case 'X':
          volume = [0.6, 0.6, 0.6, 0.6];
          delay = [50, 40, 20, 0];
          mute = true;
          break;
        case 'D':
          volume = [0.85, 0.88, 0.9, 1];
          delay = [50, 40, 20, 0];
          mute = false;
          break;
        case 'd':
          volume = [0.62, 0.63, 0.65, 0.7];
          delay = [60, 40, 20, 0];
          mute = false;
          break;
        case 'P':
          volume = [1, 0.9, 0.88, 0.85];
          delay = [0, 40, 80, 100];
          mute = false;
          break;
        case 'p':
          volume = [0.7, 0.65, 0.63, 0.62];
          delay = [0, 40, 80, 100];
          mute = false;
          break;
        case 'U':
          volume = [1, 0.9, 0.88, 0.85];
          delay = [0, 20, 40, 50];
          mute = false;
          break;
        case 'u':
          volume = [0.7, 0.65, 0.63, 0.62];
          delay = [0, 20, 40, 60];
          mute = false;
          break;
        default:
          form = volume = delay = [0, 0, 0, 0];
          mute = true;
      }
      this.send.nodes.splice(0);
      for (i = _i = 0; _i <= 3; i = ++_i) {
        if (form[i] === 0) {
          continue;
        }
        freq = this.midicps.at(form[i]);
        mul = volume[i];
        this.sched.sched(delay[i], sched_pluck(this, freq, mul, mute));
      }
      return 0;
    };

    sched_pluck = function(that, freq, mul, mute) {
      return function() {
        var send;

        if (mute) {
          send = T('perc', {
            r: 15
          }).bang().appendTo(that.send);
          T('noise', {
            mul: 0.4
          }).appendTo(send);
        } else {
          send = that.send;
          T('perc', {
            a: 10,
            r: 150
          }, T('osc', {
            wave: 'fami(25)',
            freq: freq,
            mul: mul * 0.75
          })).bang().appendTo(send);
        }
        return T('pluck', {
          freq: freq * 2,
          mul: mul * 0.8
        }).bang().appendTo(send);
      };
    };

    Sequencer.prototype.eof = function() {
      return this.pause();
    };

    Sequencer.prototype.play = function(list) {
      this.tl.setList(list);
      this.tl.start();
      this.sched.start();
      this.send.nodes.splice(0);
      return this.master.play();
    };

    Sequencer.prototype.pause = function() {
      this.tl.stop();
      this.sched.stop();
      return this.master.pause();
    };

    return Sequencer;

  })();

  window.lelenofu.Sequencer = Sequencer;

}).call(this);
