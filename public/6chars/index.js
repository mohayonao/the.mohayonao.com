(function() {
  'use strict';
  var App, app, random_gen, vue;

  random_gen = (function() {
    var BD, HH, SD;
    HH = "55|88|88|aa|aa|aa|aa|bb|ff|ff|ff|ae|ae";
    SD = "[002][8899b]";
    BD = "[8a][288aab]";
    HH = "" + HH + "|" + HH + "|" + HH + "|[0-9a-f]{2}";
    SD = "" + SD + "|" + SD + "|" + SD + "|" + SD + "|" + SD + "|[0-9a-f]{2}";
    BD = "" + BD + "|" + BD + "|" + BD + "|" + BD + "|" + BD + "|[0-9a-f]{2}";
    return function(cnt) {
      if (cnt == null) {
        cnt = '+';
      }
      return String_random("(1[046]0; )?((" + HH + ")(" + SD + ")(" + BD + ") )" + cnt).trim();
    };
  })();

  app = new (App = (function() {
    function App() {
      this.isPlaying = false;
      this.pattern = "";
    }

    App.prototype.init = function(hrm) {
      this.hrm = hrm;
    };

    App.prototype.play = function() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.hrm.setPattern(this.pattern);
        pico.play(this.hrm);
      } else {
        pico.pause();
      }
      return this.isPlaying;
    };

    App.prototype.set = function(pattern) {
      pattern = pattern.trim();
      if (this.pattern !== pattern) {
        this.pattern = pattern;
        this.hrm.setPattern(pattern);
      }
      return true;
    };

    App.prototype.validate = function(pattern) {
      return this.hrm.validate(pattern);
    };

    return App;

  })());

  vue = new Vue({
    el: '#app',
    data: {
      value: '',
      list: _.range(10).map(function() {
        return {
          value: ''
        };
      }),
      hasError: false,
      isPlaying: false
    },
    methods: {
      encodeURI: window.encodeURI,
      play: function() {
        return this.isPlaying = app.play();
      },
      random: function() {
        [2, 2, 4, 4, 8, 8, 0, 0, 0, 0].forEach((function(_this) {
          return function(n, i) {
            var cnt;
            cnt = n === 0 ? '+' : "{" + n + "}";
            return _this.list[i].value = random_gen(cnt);
          };
        })(this));
        return this.value = _.sample(this.list).value;
      },
      tweet: function() {
        var text, url, value;
        value = app.pattern;
        text = '6chars drums';
        url = "http://" + location.host + "/6chars/#" + (encodeURI(value));
        return utils.tweet({
          text: text,
          url: url
        });
      }
    }
  });

  vue.$watch('value', function() {
    var ok;
    ok = app.validate(this.value);
    if (ok) {
      app.set(this.value);
    }
    return this.hasError = !ok;
  });

  window.onhashchange = function() {
    return vue.value = decodeURI(location.hash.substr(1).trim());
  };

  WavDecoder.load('./drumkit.wav').then(function(wav) {
    var len, waves;
    waves = [];
    len = wav.buffer[0].length >> 2;
    waves[0] = wav.buffer[0].subarray(len * 0, len * 1);
    waves[1] = wav.buffer[0].subarray(len * 1, len * 2);
    waves[2] = wav.buffer[0].subarray(len * 2, len * 3);
    waves.samplerate = wav.samplerate;
    app.init(new HexRhythmMachine(pico.samplerate, waves));
    vue.random();
    if (location.hash) {
      return window.onhashchange();
    }
  });

}).call(this);
