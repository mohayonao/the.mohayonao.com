(function() {
  "use strict";

  var BD = 0, SD = 1, HH = 2;

  var neu = neume();
  var rePattern = /^(?:(\d+(?:\.\d+)?);)?(\s*(?:[0-9a-fA-F]{6})+)$/;

  function HexRhythmMachine(path) {
    var _this = this;

    this._waves = [];
    this._pattern = [ [ ], [ ], [ ] ];
    this._timer = null;

    neu.Buffer.load(path).then(function(buffer) {
      _this._waves = buffer.split(4);
    });
  }

  HexRhythmMachine.prototype.start = function() {
    neu.start();

    if (this._timer) {
      this._timer.stop();
    }
    if (this._waves) {
      this._timer = neu.Interval("16n", process.bind(this));
      this._timer.start();
    }
  };

  HexRhythmMachine.prototype.stop = function() {
    if (this._timer) {
      this._timer.stop();
    }
    this._timer = null;

    neu.stop();
  };

  HexRhythmMachine.prototype.setPattern = function(pattern) {
    var matches = rePattern.exec(pattern.replace(/\s+/g, ""));

    if (!matches) {
      return;
    }

    neu.bpm = toBPM(matches[1]);

    pattern = matches[2];

    this._pattern = [ [ ], [ ], [ ] ];

    for (var i = 0, imax = pattern.length / 6; i < imax; i++) {
      var hh = parseInt(pattern.substr(i * 6 + 0, 2), 16);
      var sd = parseInt(pattern.substr(i * 6 + 2, 2), 16);
      var bd = parseInt(pattern.substr(i * 6 + 4, 2), 16);
      for (var j = 7; j >= 0; j--) {
        this._pattern[HH].push(!!(hh & (1 << j)));
        this._pattern[SD].push(!!(sd & (1 << j)));
        this._pattern[BD].push(!!(bd & (1 << j)));
      }
    }
  };

  HexRhythmMachine.prototype.validate = function(pattern) {
    return rePattern.test(pattern.replace(/\s+/g, ""));
  };

  function toBPM(value) {
    value = +value || 0;
    if (value < 20 || 300 < value) {
      value = 120;
    }
    return value;
  }

  function wrapAt(list, index) {
    return list[index % list.length];
  }

  function Dub($, buffer, amp) {
    return $(buffer, { mul: amp }).on("end", $.stop);
  }

  function process(e) {
    var amp;

    if (wrapAt(this._pattern[HH], e.count)) {
      amp = [ 0.2, 0.05, 0.15, 0.05 ][e.count % 4];
      neu.Synth(Dub, this._waves[HH], amp).start(e.playbackTime);
    }

    if (wrapAt(this._pattern[SD], e.count)) {
      amp = [ 0.8, 0.4, 0.6, 0.4 ][e.count % 4];
      neu.Synth(Dub, this._waves[SD], amp).start(e.playbackTime);
    }

    if (wrapAt(this._pattern[BD], e.count)) {
      amp = [ 0.6, 0.25, 0.5, 0.3 ][e.count % 4];
      neu.Synth(Dub, this._waves[BD], amp).start(e.playbackTime);
    }
  }

  window.HexRhythmMachine = HexRhythmMachine;

})();
