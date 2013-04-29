/*

 timbre.js - the concept book
 Chapter 02 - Definition of Synth
*/


(function() {
  var bd, beat, hh, p, pattern, sd, synth;

  synth = T("SynthDef", {
    def: function(opts) {
      var syn, _ref, _ref1;

      syn = T("fami", {
        freq: (_ref = opts.freq) != null ? _ref : 440,
        mul: 0.25
      });
      return syn = syn.to("perc", {
        r: (_ref1 = opts.dur) != null ? _ref1 : 500
      }).bang();
    }
  });

  synth.play();

  synth.synth({
    freq: 60..midicps()
  });

  synth.synth({
    freq: 67..midicps()
  });

  synth.synth({
    freq: 69..midicps()
  });

  synth.synth({
    freq: [84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96].choose().midicps(),
    dur: 100
  });

  p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].scramble().midiratio().slice(0, 4);

  T("interval", {
    interval: "bpm138 l8"
  }, function(count) {
    return synth.synth({
      freq: 440 * p.wrapAt(count),
      dur: (count % 16) * 25 + 100
    });
  }).set({
    buddies: synth
  }).start();

  synth = T("SynthDef", {
    def: function(opts) {
      var syn;

      syn = T("fami", {
        freq: opts.freq,
        mul: 0.25
      });
      return syn = syn.to("adsr", {
        a: 20,
        d: 120,
        s: 0.8,
        r: 1500,
        mul: opts.mul
      }).bang();
    }
  }).play();

  synth.noteOn(60, 80);

  synth.noteOff(60);

  synth = T("SynthDef", {
    poly: 1,
    def: function(opts) {
      var syn;

      syn = T("sin", {
        freq: opts.freq,
        phase: T("sin", {
          freq: opts.freq * 3,
          mul: 2.5
        }),
        mul: 0.25
      });
      return syn = syn.to("adsr", {
        d: 250,
        s: 0.75,
        r: 500,
        mul: opts.mul
      }).bang();
    }
  });

  T("mml", {
    mml: "t80 o5 l16 gf+d+>a g+<eg+<c r8"
  }, synth).on("ended", function() {
    return this.stop();
  }).set({
    buddies: synth
  }).start();

  bd = T("SynthDef", {
    poly: 1,
    def: function(opts) {
      var a, _ref;

      a = T("pulse", {
        freq: T("param", {
          value: 60
        }).linTo(40, "50ms")
      });
      a = a.to("lpf", {
        cutoff: 80,
        Q: 20
      });
      return a = a.to("perc", {
        r: 200,
        lv: (_ref = opts.lv) != null ? _ref : 1
      }).bang();
    }
  }).set({
    mul: 0.8
  });

  sd = T("SynthDef", {
    poly: 1,
    def: function(opts) {
      var a, _ref, _ref1;

      a = T("pink", {
        mul: 0.5
      });
      a = a.to("lowshelf", {
        cutoff: 800,
        gain: 5
      });
      a = a.to("perc", {
        r: (_ref = opts.dur) != null ? _ref : 150,
        lv: (_ref1 = opts.lv) != null ? _ref1 : 1
      }).bang();
      return a = a.to("reverb", {
        room: 0.4
      });
    }
  }).set({
    mul: 0.8
  });

  hh = T("SynthDef", {
    poly: 1,
    def: function(opts) {
      var a, _ref, _ref1;

      a = T("pink");
      a = a.to("hpf", {
        cutoff: 8800,
        Q: 20
      });
      return a = a.to("perc", {
        r: (_ref = opts.r) != null ? _ref : 50,
        lv: (_ref1 = opts.lv) != null ? _ref1 : 0.8
      }).bang();
    }
  }).set({
    mul: 0.25
  });

  pattern = "X...O.x. ..o.O...".replace(/\s+/g, '');

  beat = T("interval", {
    interval: "bpm138 l16"
  }, function(count) {
    switch (pattern.charAt(count % pattern.length)) {
      case "X":
        bd.synth({
          lv: 1
        });
        break;
      case "x":
        bd.synth({
          lv: 0.4
        });
        break;
      case "O":
        sd.synth({
          lv: 1
        });
        break;
      case "o":
        sd.synth({
          lv: 0.4,
          dur: 75
        });
    }
    return hh.synth({
      r: count % 4 === 2 ? 250 : 50,
      lv: count % 2 === 0 ? 0.8 : 0.2
    });
  }).set({
    buddies: T("comp", {
      thresh: -24,
      knee: 10,
      gain: 12
    }, hh, sd, bd)
  }).start();

  goto("index");

  goto("chapter01");

  goto("chapter03");

}).call(this);
