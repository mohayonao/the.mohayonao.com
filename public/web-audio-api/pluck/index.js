(function() {
  'use strict';
  var DURATION, audioContext, generators, midicps, pluck, timerId;

  audioContext = new AudioContext;

  DURATION = 0.5;

  midicps = function(midi) {
    return 440 * Math.pow(2, (midi - 69) * 1 / 12);
  };

  pluck = function(freq, duration) {
    var buffer, sampleRate;
    sampleRate = audioContext.sampleRate;
    buffer = audioContext.createBuffer(1, sampleRate * duration, audioContext.sampleRate);
    buffer.getChannelData(0).set(new KarplusStrong(sampleRate, freq, duration));
    return buffer;
  };

  generators = [0, 2, 3, 7, 9].map(function(x) {
    return pluck(midicps(x + 60), DURATION);
  });

  timerId = 0;

  $('#test').on('click', function() {
    if (timerId) {
      clearInterval(timerId);
      return timerId = 0;
    } else {
      return timerId = setInterval(function() {
        var vca, vcf, vco;
        vco = audioContext.createBufferSource();
        vco.buffer = _.sample(generators);
        vcf = audioContext.createBiquadFilter();
        vcf.type = "lowpass";
        vcf.frequency.value = 2400;
        vcf.Q.value = 0.5;
        vca = audioContext.createGain();
        vca.gain.setValueAtTime(0.5, audioContext.currentTime);
        vca.gain.linearRampToValueAtTime(0, audioContext.currentTime + DURATION);
        vco.start(0);
        vco.onended = function() {
          return vca.disconnect();
        };
        vco.connect(vcf);
        vcf.connect(vca);
        return vca.connect(audioContext.destination);
      }, 250);
    }
  });

}).call(this);
