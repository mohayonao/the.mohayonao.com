(function() {
  "use strict";

  var HexRhythmMachine = (function() {
    function HexRhythmMachine() {
      this.initialize.apply(this, arguments);
    }
    HexRhythmMachine.prototype.initialize = function(samplerate, waves) {
      this.samplerate = samplerate;
      this.waves = waves;
      this.bpm = 120.0;
      this.pattern = [ [ ], [ ], [ ] ];
      this.phases  = [ Infinity, Infinity, Infinity ];
      this.phaseStep = waves.samplerate / samplerate;
      this.vols    = [ 0, 0, 0 ];
      this.index    = 0;
      this.count    = 0;
      this.countMax = 0;
      this.isPlaying = false;
      this.volume = 1.0;
      this.mute = false;
    };
    HexRhythmMachine.prototype.play = function(pattern) {
      if (!!pattern) {
        if (this.setPattern(pattern)) {
          this.isPlaying = true;
        } else {
          this.isPlaying = false;
        }
      } else if (this.isPlaying) {
        this.isPlaying = false;
      } else {
        this.isPlaying = true;
      }
      return this.isPlaying;
    };
    var re = /^(?:(\d+(?:\.\d+)?);)?(\s*(?:[0-9a-fA-F]{6})+)$/;
    HexRhythmMachine.prototype.setPattern = function(pattern) {
      var matches, bpm, bd, sd, hh;
      var i, imax, j;
      matches= re.exec(pattern.replace(/\s+/g, ""));
      if (matches) {
        bpm     = matches[1] || 0.0;
        pattern = matches[2];
        if (30 <= bpm && bpm <= 600) {
          this.bpm = Number(bpm);
        }
        this.pattern = [ [ ], [ ], [ ] ];
        this.phases  = [ Infinity, Infinity, Infinity ];
        for (i = 0, imax = pattern.length/6; i < imax; i++) {
          bd = Number("0x" + pattern.substr(i * 6 + 0, 2));
          sd = Number("0x" + pattern.substr(i * 6 + 2, 2));
          hh = Number("0x" + pattern.substr(i * 6 + 4, 2));
          for (j = 7; j >= 0; j--) {
            this.pattern[0].push(!!(hh & (1 << j)));
            this.pattern[1].push(!!(sd & (1 << j)));
            this.pattern[2].push(!!(bd & (1 << j)));
          }
        }
        this.countMax = (60/this.bpm) * this.samplerate * (4/16);
        return true;
      }
      return false;
    };
    HexRhythmMachine.prototype.process = function(L, R) {
      var inNumSamples = L.length;
      
      this.count -= inNumSamples;
      if (this.count <= 0) {
        if (this.pattern[0][this.index]) { // bd
          this.phases[0] = 0;
          this.vols[0] = [0.6, 0.5][this.index % 2];
        }
        if (this.pattern[1][this.index]) { // sd
          this.phases[1] = 0;
          this.vols[1] = [0.8, 0.5][this.index % 2];
        }
        if (this.pattern[2][this.index]) { // hh
          this.phases[2] = 0;
          this.vols[2] = [0.2, 0.05][this.index % 2];
        }
        this.index += 1;
        if (this.index >= this.pattern[0].length) {
          this.index = 0;
        }
        this.count += this.countMax;
      }
      for (var i = 0; i < inNumSamples; i++) {
        var x = 0;
        x += (this.waves[0][this.phases[0]|0] || 0.0) * this.vols[0];
        x += (this.waves[1][this.phases[1]|0] || 0.0) * this.vols[1];
        x += (this.waves[2][this.phases[2]|0] || 0.0) * this.vols[2];
        this.phases[0] += this.phaseStep;
        this.phases[1] += this.phaseStep;
        this.phases[2] += this.phaseStep;
        L[i] = R[i] = x;
      }
    };
    return HexRhythmMachine;
  })();

  window.HexRhythmMachine = HexRhythmMachine;

})();
