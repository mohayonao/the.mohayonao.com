(function() {
  $(function() {
    'use strict';    WavDecoder.load("./drumkit.wav").then(function(wav) {
      var $p, hash, hrm, isPlaying, len, prev, setPattern, waves;

      waves = [];
      len = wav.buffer[0].length >> 2;
      waves[0] = wav.buffer[0].subarray(len * 0, len * 1);
      waves[1] = wav.buffer[0].subarray(len * 1, len * 2);
      waves[2] = wav.buffer[0].subarray(len * 2, len * 3);
      waves.samplerate = wav.samplerate;
      hrm = new HexRhythmMachine(pico.samplerate, waves);
      $p = $("#p");
      isPlaying = false;
      $('#play').on('click', function() {
        isPlaying = !isPlaying;
        if (isPlaying) {
          hrm.setPattern($p.val());
          pico.play(hrm);
          return $(this).css('color', 'red');
        } else {
          pico.pause();
          return $(this).css('color', 'black');
        }
      });
      prev = $p.val();
      setPattern = function() {
        var val;

        val = $p.val().trim();
        if (val !== prev) {
          if (hrm.validate(val)) {
            hrm.setPattern(val);
            $p.css('color', 'black');
          } else {
            $p.css('color', 'red');
          }
        }
        return prev = val;
      };
      $p.on('keyup', setPattern);
      $("#tweet").on('click', function() {
        var text, url, val;

        val = $p.val().trim();
        if (hrm.validate(val)) {
          text = '6chars drums';
          url = "http://" + location.host + "/6chars/#" + (encodeURI(val));
          return apps.tweet({
            text: text,
            url: url
          });
        }
      });
      if (location.hash) {
        hash = decodeURI(location.hash.substr(1).trim());
        if (hrm.validate(hash)) {
          $p.val(hash);
          setPattern();
          if (apps.isDesktop) {
            return $('#play').click();
          }
        }
      }
    });
    return 0;
  });

}).call(this);
