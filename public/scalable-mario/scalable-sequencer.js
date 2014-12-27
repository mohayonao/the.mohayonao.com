(function() {
  "use strict";

  var neu = neume();

  var baseRoot = 60;
  var baseScale = sc.Scale.major();
  var rootFreq = baseRoot.midicps() * 0.5

  function SynthTone($, freq) {
    return $("square", { freq: freq })
    .$("xline", { start: 0.1, end: 0.001, dur: 0.25 }).on("end", $.stop)
    .$("out", { bus: 1 });
  }

  function Destination($) {
    return $([
      $("in", { bus: 1 }),
      $("in", { bus: 1 }).$("delay", { delay: "16n", mul: 0.25 })
    ]);
  }

  function ScalableSequencer(mmlData) {
    this._mmlData = mmlData;
    this._mml = null;
    this._dst = null;
    this._scale = sc.Scale.major();
  }

  ScalableSequencer.scales = (function() {
    var scales = {};

    sc.ScaleInfo.names().forEach(function(key) {
      var scale = sc.ScaleInfo.at(key);

      if (scale.pitchesPerOctave() !== 12) {
        return;
      }

      scales[key] = scale;
    });

    return scales;
  })();

  ScalableSequencer.tunings = (function() {
    var tunings = {};

    sc.TuningInfo.names().forEach(function(key) {
      var tuning = sc.TuningInfo.at(key);

      if (tuning.size() !== 12) {
        return;
      }

      tunings[key] = tuning;
    });

    return tunings;
  })();

  ScalableSequencer.prototype.start = function() {
    var _this = this;

    neu.start();

    if (this._dst) {
      this._dst.stop();
    }
    if (this._mml) {
      this._mml.stop();
    }

    this._dst = neu.Synth(Destination).start();
    this._mml = new MMLEmitter(neu.context, this._mmlData);
    this._mml.tracks.forEach(function(track) {
      track.on("note", function(e) {
        if (e.type !== "note") {
          return;
        }

        var key = e.midi - baseRoot;
        var deg = baseScale.performKeyToDegree(key);
        var freq = _this._scale.degreeToFreq2(deg, rootFreq, 0);

        neu.Synth(SynthTone, freq).start(e.playbackTime);
      });
    });
    this._mml.start();
  };

  ScalableSequencer.prototype.stop = function() {
    if (this._dst) {
      this._dst.stop();
    }
    if (this._mml) {
      this._mml.stop();
    }
    this._dst = null;
    this._mml = null;

    neu.stop();
  };

  ScalableSequencer.prototype.setScale = function(name) {
    var tuning = this._scale.tuning();
    this._scale = sc.ScaleInfo.at(name);
    this._scale.tuning(tuning);
  };

  ScalableSequencer.prototype.setTuning = function(name) {
    this._scale.tuning(sc.TuningInfo.at(name));
  };

  window.ScalableSequencer = ScalableSequencer;

})();
