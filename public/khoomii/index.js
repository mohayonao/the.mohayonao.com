(function() {
  'use strict';
  var FORMANT_PARAMS, Khoomii, KhoomiiVoice, Neume, app, clip, hash, items, linexp, linlin, vue;

  Neume = neume(new AudioContext());

  FORMANT_PARAMS = {
    a: [700, 1200, 2900],
    i: [300, 2700, 2700],
    u: [390, 1200, 2500],
    e: [450, 1750, 2750],
    o: [460, 880, 2800]
  };

  clip = function(num, min, max) {
    return Math.max(min, Math.min(num, max));
  };

  linlin = function(num, inMin, inMax, outMin, outMax) {
    return (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
  };

  linexp = function(num, inMin, inMax, outMin, outMax) {
    return Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin;
  };

  KhoomiiVoice = function($, formants) {
    var out, spiritual, voiceBand, voiceDepth, voiceFreq, voiceMod;
    voiceFreq = $.param('voiceFreq', 174.61412048339844);
    voiceMod = $.param('voiceMod', 0.8);
    voiceDepth = $.param('voiceDepth', 6);
    voiceBand = $.param('voiceBand', 830);
    spiritual = $.param('spiritual', 0.125);
    out = $('saw', {
      freq: voiceFreq,
      detune: $('sin', {
        freq: voiceMod,
        mul: voiceDepth
      })
    });
    out = _.map(formants, function(freq, index) {
      return $('bpf', {
        freq: $(formants, {
          key: index,
          timeConstant: 0.25
        }),
        Q: 12
      }, out);
    });
    out = $('bpf', {
      freq: voiceBand,
      Q: 0.45
    }, out);
    out = [
      out, $('comb', {
        delay: 0.25,
        fbGain: spiritual,
        gain: 1,
        mul: 0.45
      }, out)
    ];
    return out = $('lpf', {
      freq: 3200,
      Q: 2,
      mul: 0.8
    }, out);
  };

  Khoomii = (function() {
    function Khoomii() {
      this._voice = null;
      this._formants = new Float32Array(3);
      this._formants.set(_.sample(FORMANT_PARAMS));
    }

    Khoomii.prototype.change = function() {
      return this._formants.set(_.sample(FORMANT_PARAMS).map((function(_this) {
        return function(freq) {
          return freq * ((Math.random() * 0.15) + 0.925);
        };
      })(this)));
    };

    Khoomii.prototype.setValue = function(type, value) {
      if (this._voice) {
        return this._voice[type] = value;
      }
    };

    Khoomii.prototype.play = function() {
      var _ref;
      if ((_ref = this._voice) != null) {
        _ref.stop();
      }
      return this._voice = Neume.Synth(KhoomiiVoice, this._formants).start();
    };

    Khoomii.prototype.stop = function() {
      var _ref;
      if ((_ref = this._voice) != null) {
        _ref.stop();
      }
      return this._voice = null;
    };

    return Khoomii;

  })();

  app = new ((function() {
    function _Class() {}

    _Class.prototype.setValue = function(type, value) {
      var depth, freq, level;
      if (this.khoomii) {
        switch (type) {
          case 'voice.freq':
            freq = linexp(value, 1, 100, 65.40639132514966, 261.6255653005986);
            return this.khoomii.setValue('voiceFreq', freq);
          case 'voice.mod':
            freq = linexp(value, 1, 100, 0.05, 25);
            depth = 100 - Math.abs(value - 50) * 2;
            depth = linlin(depth, 1, 100, 1, 30);
            this.khoomii.setValue('voiceMod', freq);
            return this.khoomii.setValue('voiceDepth', depth);
          case 'voice.band':
            freq = linexp(value, 1, 100, 130.8127826502993, 2 * 4186.009044809578);
            return this.khoomii.setValue('voiceBand', freq);
          case 'spiritual':
            level = linlin(value, 1, 100, 0.2, 0.99);
            return this.khoomii.setValue('spiritual', level);
        }
      }
    };

    _Class.prototype.play = function() {
      this.khoomii = new Khoomii();
      this.khoomii.play();
      return this.timerId = setInterval((function(_this) {
        return function() {
          return _this.khoomii.change();
        };
      })(this), 250);
    };

    _Class.prototype.stop = function() {
      this.khoomii.stop();
      return clearInterval(this.timerId);
    };

    return _Class;

  })());

  vue = new Vue({
    el: '#app',
    data: {
      params: [
        {
          name: 'voice.freq',
          value: 70
        }, {
          name: 'voice.mod',
          value: 10
        }, {
          name: 'voice.band',
          value: 45
        }, {
          name: 'spiritual',
          value: 5
        }
      ],
      isPlaying: false
    },
    methods: {
      update: function(type, value) {
        var params;
        params = _.pluck(this.params, 'value');
        window.location.replace("#" + params.join(','));
        return app.setValue(type, clip(value, 1, 100));
      },
      play: function() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
          app.play();
          return this.params.forEach((function(_this) {
            return function(param) {
              return app.setValue(param.name, clip(param.value, 1, 100));
            };
          })(this));
        } else {
          return app.stop();
        }
      },
      tweet: function() {
        var text;
        text = utils.lang({
          ja: 'ホーミー',
          '': document.title
        });
        return utils.tweet({
          text: text,
          url: window.location.href
        });
      }
    }
  });

  if (window.location.hash) {
    hash = decodeURIComponent(window.location.hash.substr(1));
    items = hash.split(',');
    vue.params.forEach(function(param, i) {
      return param.value = clip(items[i] | 0, 1, 100);
    });
  }

  vue.update();

}).call(this);
