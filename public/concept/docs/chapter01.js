/*

 timbre.js - the concept book
 Chapter 01 - Oscillator and Envelope
*/


(function() {
  var a;

  a = T("sin").play();

  a.freq = 493.88;

  a.freq = 554.36;

  a.freq *= Math.pow(2, 1 / 12);

  a.mul = 0.5;

  a.add = 1.0;

  a.add = 0;

  a.freq = T("sin.kr", {
    freq: 5,
    mul: 20,
    add: 880
  });

  a.freq = T("param", {
    value: 880
  }).expTo(220, "1.5sec");

  a.mul = T("sin.kr");

  a.pause();

  a = T("*", T("pulse", {
    freq: 660,
    mul: 0.25
  }), T("perc", {
    r: 1000
  }).bang()).play();

  a.pause();

  a = T("perc", {
    r: 1000
  }, T("pulse", {
    freq: 660,
    mul: 0.25
  })).bang().play();

  a.bang();

  a.pause();

  a = T("pulse", {
    freq: 660,
    mul: 0.25
  }).to("perc", {
    r: 1000
  }).bang().play();

  a.bang();

  a.pause();

  a = T("pulse", {
    freq: 660,
    mul: 0.25
  }).to("perc", {
    r: 1000
  }).on("ended", function() {
    return this.pause();
  }).bang().play();

  a = T("+", T("sin", {
    freq: 880,
    mul: 0.5
  }), T("sin", {
    freq: 890,
    mul: 0.5
  })).to("perc", {
    r: 5000
  }).bang().on("ended", function() {
    return this.pause();
  }).play();

  T("perc", {
    r: 5000
  }, T("sin", {
    freq: 880,
    mul: 0.5
  }), T("sin", {
    freq: 890,
    mul: 0.5
  })).on("ended", function() {
    return this.pause();
  }).bang().play();

  T("lpf", {
    cutoff: T("param", {
      value: 200
    }).linTo(6400, "4sec"),
    Q: 5
  }, T("saw", {
    freq: 880,
    mul: 0.25
  }), T("saw", {
    freq: 890,
    mul: 0.25
  })).to("perc", {
    r: 5000
  }).on("ended", function() {
    return this.pause();
  }).bang().play();

  a = T("sin", {
    freq: 880
  }).to("+tri.kr", {
    freq: 12
  }).play();

  a.pause();

  (function() {
    var car, mod;

    mod = T("sin", {
      freq: 440 * 7,
      fb: 0.2
    });
    car = T("sin", {
      freq: 440,
      phase: mod,
      mul: 0.25
    });
    return car.to("perc", {
      r: "1sec"
    }).on("ended", function() {
      return this.pause();
    }).bang().play();
  })();

  (function() {
    var car, mod;

    mod = T("sin", {
      freq: 220,
      mul: 4
    });
    mod = mod.to("adshr.ar", {
      a: 50,
      d: 250,
      s: 0.9,
      h: 10,
      r: 1000
    }).bang();
    car = T("sin", {
      freq: 440,
      phase: mod,
      mul: 0.25
    });
    car = car.to("adshr", {
      a: 0,
      d: 500,
      s: 0.5,
      h: 1000,
      r: 2000
    }).on("ended", function() {
      return this.pause();
    });
    return car.bang().play();
  })();

  goto("index");

  goto("chapter02");

}).call(this);
