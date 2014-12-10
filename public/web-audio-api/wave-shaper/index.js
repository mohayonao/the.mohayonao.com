(function() {
  $(function() {
    'use strict';
    var AudioContext, a, b, c;
    AudioContext = window.AudioContext || window.webkitAudioContext;
    a = new AudioContext();
    b = null;
    c = null;
    return $('#start').on('click', function() {
      if (b === null) {
        b = a.createOscillator();
        c = a.createWaveShaper();
        c.curve = new Float32Array([-1, +1]);
        b.connect(c);
        c.connect(a.destination);
        return b.start(a.currentTime);
      } else {
        b.stop(a.currentTime);
        b.disconnect();
        c.disconnect();
        return b = c = null;
      }
    });
  });

}).call(this);
