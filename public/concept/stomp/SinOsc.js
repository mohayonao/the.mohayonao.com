(function(stomp) {
  "use strict";

  var twopi = 2 * Math.PI;

  function SinOsc(opts) {
    stomp.UGen.call(this, opts);
    this._freqIn  = opts.freq;
    this._phaseIn = opts.phase;
    this._phase = 0;
    
    this._calcFunc = next_aa;
  }
  stomp.extend(SinOsc);

  var next_aa = function() {
    var cell = this.cell;
    var samples = cell.length;
    var freqIn, phaseIn;
    var phase, cpstonic;
    var i;

    freqIn  = this._freqIn.process().cell;
    phaseIn = this._phaseIn.process().cell;
    phase   = this._phase;
    cpstonic = 1 / this.samplerate;
    
    for (i = 0; i < samples; ++i) {
      cell[i] = Math.sin((phase + phaseIn[i]) * twopi);
      phase += freqIn[i] * cpstonic;
    }
    this._phase = phase;
  };

  stomp.register("SinOsc", SinOsc, {
    type: "gen",
    args: [{freq:440},{phase:0},{mul:1},{add:0}]
  });

})(stomp);
