(function() {
  $(function() {
    'use strict';    WavDecoder.load('./drumkit.wav').then(function(wav) {
      var $list, $p, BD, HH, SD, generate, hrm, isFirst, isPlaying, len, prev, random, setPattern, waves;

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
      generate = function(cnt) {
        if (cnt == null) {
          cnt = '+';
        }
        return String_random("(1[046]0; )?((" + HH + ")(" + SD + ")(" + BD + ") )" + cnt).trim();
      };
      $('#random').on('click', function() {
        var val;

        val = random();
        return location.href = "http://" + location.host + "/6chars/#" + (encodeURI(val));
      });
      $('#tweet').on('click', function() {
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
      $list = $('#list');
      random = function() {
        var $li, cnt, i, list, url, val;

        $list.empty();
        list = (function() {
          var _i, _results;

          _results = [];
          for (i = _i = 0; _i < 10; i = ++_i) {
            cnt = ((i >> 1) + 1) << 1;
            cnt = cnt === 10 ? '+' : "{" + cnt + "}";
            val = generate(cnt);
            url = "http://" + location.host + "/6chars/#" + (encodeURI(val));
            $li = $('<li>').append($('<a>').attr({
              href: url
            }).text(val));
            $list.append($li);
            _results.push(val);
          }
          return _results;
        })();
        return list[(Math.random() * list.length) | 0];
      };
      isFirst = false;
      window.onhashchange = function() {
        var hash;

        hash = decodeURI(location.hash.substr(1).trim());
        if (hrm.validate(hash)) {
          $p.val(hash);
          setPattern();
          if (isFirst) {
            return isFirst = false;
          } else if (!isPlaying && apps.isDesktop) {
            return $('#play').click();
          }
        }
      };
      if (location.hash) {
        return window.onhashchange();
      } else {
        isFirst = true;
        return $('#random').click();
      }
    });
    return 0;
  });

}).call(this);
