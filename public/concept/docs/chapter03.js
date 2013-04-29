/*

 timbre.js - the concept book
 Chapter 03 - Audio Buffer
*/


(function() {
  var a, bd, i, list, p, pattern, sd, seq, t, tape, tape1, tapes;

  a = T("audio", {
    load: "drum.wav",
    loop: true
  });

  a.play();

  a.to("delay", {
    time: 100
  }).play();

  a.set({
    reverse: true
  }).play();

  a.set({
    reverse: false
  }).pause();

  a.set({
    pitch: 0.8
  }).play();

  a.pitch = T("param", {
    value: 0.8
  }).linTo(1.2, "5sec");

  a.pitch = 1;

  a.currentTime = Math.random() * a.duration;

  a.play();

  list = (function() {
    var _i, _results;

    _results = [];
    for (i = _i = 0; _i < 16; i = ++_i) {
      t = a.duration / 16;
      _results.push(a.slice(t * i, (i + 1) * t).set({
        loop: false
      }));
    }
    return _results;
  })();

  p = [0, 1, 2, 3, 4, 5, 6, 7].scramble();

  i = T("interval", {
    interval: a.duration / 16
  }, function(count) {
    return list[p.wrapAt(count)].clone().on("ended", function() {
      return this.pause();
    }).set({
      loop: false
    }).play();
  }).start();

  T("audio", {
    load: "drum.wav"
  }).slice(0, 2000).on("ended", function() {
    return this.pause();
  }).play();

  T("audio").load("drum.wav").then(function() {
    return this.slice(0, 2000).on("ended", function() {
      return this.pause();
    }).play();
  });

  a = T("audio", {
    load: "drum.wav"
  });

  a.slice(0, 2000).on("ended", function() {
    return this.pause();
  }).play();

  a = T("audio", {
    load: "drum.wav",
    loop: true
  });

  tape = T("tape", {
    tape: a
  }).tape;

  tapes = [];

  tapes = tapes.concat(tape.split(16).stutter(16));

  tapes = tapes.concat(tape.split(512).map(function(t) {
    return t.loop(16);
  }));

  tape1 = T("tape", {
    loop: true
  }).play();

  tape1.tape = tape.join(tapes.scramble().slice(0, 16));

  bd = T("buffer", {
    buffer: tapes[0],
    bang: false
  });

  sd = T("buffer", {
    buffer: tapes[32],
    bang: false
  });

  seq = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(function(i) {
    return T("buffer", {
      buffer: tapes[256 + (Math.random() * 512) | 0],
      bang: false
    });
  });

  pattern = "X.-.O.xo -.-.O.--".replace(/\s+/g, '');

  T("interval", {
    interval: "bpm134 l16"
  }, function(count) {
    switch (pattern.charAt(count % pattern.length)) {
      case "X":
        return bd.set({
          mul: 1.0
        }).bang();
      case "x":
        return bd.set({
          mul: 0.4
        }).bang();
      case "O":
        return sd.set({
          mul: 1.0
        }).bang();
      case "o":
        return sd.set({
          mul: 0.4
        }).bang();
      case "-":
        return seq.choose().bang();
    }
  }).set({
    buddies: [bd, sd].concat(seq)
  }).start();

  goto("index");

  goto("chapter02");

}).call(this);
