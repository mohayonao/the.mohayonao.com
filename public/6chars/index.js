(function() {
  $(function() {
    'use strict';    return WavDecoder.load("./drumkit.wav").then(function(wav) {
      var hrm, len, waves;

      waves = [];
      len = wav.buffer[0].length >> 3;
      waves[0] = wav.buffer[0].subarray(len * 0, len * 1);
      waves[1] = wav.buffer[0].subarray(len * 1, len * 2);
      waves[2] = wav.buffer[0].subarray(len * 2, len * 3);
      hrm = new HexRhythmMachine(wav.samplerate, waves);
      hrm.setPattern("aa0980 aa08a2");
      return pico.play(hrm);
    });
  });

}).call(this);
