(function() {
  $(function() {
    'use strict';    WavDecoder.load("./drumkit.wav").then(function(wav) {
      var $p, BD, HH, SD, defaults, hrm, isPlaying, len, prev, setPattern, waves;

      waves = [];
      len = wav.buffer[0].length >> 2;
      waves[0] = wav.buffer[0].subarray(len * 0, len * 1);
      waves[1] = wav.buffer[0].subarray(len * 1, len * 2);
      waves[2] = wav.buffer[0].subarray(len * 2, len * 3);
      waves.samplerate = wav.samplerate;
      hrm = new HexRhythmMachine(pico.samplerate, waves);
      $p = $('#p');
      prev = null;
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
      HH = "55|88|88|aa|aa|aa|aa|bb|ff|ff|ff|ae|ae";
      SD = "[002][8899b]";
      BD = "[8a][288aab]";
      HH = "" + HH + "|" + HH + "|" + HH + "|[0-9a-f]{2}";
      SD = "" + SD + "|" + SD + "|" + SD + "|" + SD + "|" + SD + "|[0-9a-f]{2}";
      BD = "" + BD + "|" + BD + "|" + BD + "|" + BD + "|" + BD + "|[0-9a-f]{2}";
      $("#random").on('click', function() {
        var val;

        val = String_random("(1[046]0; )?((" + HH + ")(" + SD + ")(" + BD + ") ){2,8}").trim();
        return location.href = "http://" + location.host + "/6chars/#" + (encodeURI(val));
      });
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
      defaults = [];
      $("li", "#list").each(function(i, li) {
        var $li, url, val;

        $li = $(li);
        val = $li.text().trim();
        url = "http://" + location.host + "/6chars/#" + (encodeURI(val));
        $(li).empty().append($("<a>").attr({
          href: url
        }).text(val));
        return defaults.push(val);
      });
      $p.val(defaults[(Math.random() * defaults.length) | 0]);
      window.onhashchange = function() {
        var hash;

        hash = decodeURI(location.hash.substr(1).trim());
        if (hrm.validate(hash)) {
          $p.val(hash);
          setPattern();
          if (!isPlaying && apps.isDesktop) {
            return $('#play').click();
          }
        }
      };
      if (location.hash) {
        return window.onhashchange();
      }
    });
    return 0;
  });

}).call(this);
