(function() {
  $(function() {
    'use strict';    WavDecoder.load("./drumkit.wav").then(function(wav) {
      var hrm, isPlaying, len, prev, waves;

      waves = [];
      len = wav.buffer[0].length >> 2;
      waves[0] = wav.buffer[0].subarray(len * 0, len * 1);
      waves[1] = wav.buffer[0].subarray(len * 1, len * 2);
      waves[2] = wav.buffer[0].subarray(len * 2, len * 3);
      waves.samplerate = wav.samplerate;
      hrm = new HexRhythmMachine(pico.samplerate, waves);
      isPlaying = false;
      $('#play').on('click', function() {
        isPlaying = !isPlaying;
        if (isPlaying) {
          hrm.setPattern($("#p").val());
          pico.play(hrm);
          return $(this).css('color', 'red');
        } else {
          pico.pause();
          return $(this).css('color', 'black');
        }
      });
      prev = $("#p").val();
      return $("#p").on('keyup', function() {
        var val;

        val = $("#p").val();
        if (val !== prev) {
          hrm.setPattern(val);
        }
        return prev = val;
      });
    });
    return 0;
  });

}).call(this);
