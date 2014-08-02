(function() {
  'use strict';
  var Khoomii, app, clip, hash, items, linexp, linlin, vue;

  clip = function(num, min, max) {
    return Math.max(min, Math.min(num, max));
  };

  linlin = function(num, inMin, inMax, outMin, outMax) {
    return (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
  };

  linexp = function(num, inMin, inMax, outMin, outMax) {
    return Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin;
  };

  Khoomii = (function() {
    var FORMANT_PARAMS;

    FORMANT_PARAMS = {
      a: [700, 1200, 2900],
      i: [300, 2700, 2700],
      u: [390, 1200, 2500],
      e: [450, 1750, 2750],
      o: [460, 880, 2800]
    };

    function Khoomii() {
      this.context = new AudioContext;
      this.freq = 174.61412048339844;
      this.out = this.context.createGain();
      this.mod = this.context.createOscillator();
      this.mod.frequency.value = 0.8;
      this.modGain = this.context.createGain();
      this.modGain.gain.value = 6;
      this.mod.connect(this.modGain);
      this.voice = this.context.createOscillator();
      this.voice.type = 'sawtooth';
      this.voice.frequency.value = this.freq;
      this.modGain.connect(this.voice.detune);
      this.mod.start(0);
      this.voice.start(0);
      this.bpf = this.context.createBiquadFilter();
      this.bpf.type = "bandpass";
      this.bpf.frequency.value = 830;
      this.bpf.Q.value = 0.45;
      this.formants = _.sample(FORMANT_PARAMS).map((function(_this) {
        return function(freq) {
          var formant;
          formant = _this.context.createBiquadFilter();
          formant.type = "bandpass";
          formant.frequency.value = freq;
          formant.Q.value = 12;
          _this.voice.connect(formant);
          formant.connect(_this.bpf);
          return formant;
        };
      })(this));
      this.delay = this.context.createDelay();
      this.delay.delayTime.value = 0.25;
      this.delayFB = this.context.createGain();
      this.delayFB.gain.value = 0.125;
      this.delayDry = this.context.createGain();
      this.delayDry.gain.value = 0.7;
      this.delayWet = this.context.createGain();
      this.delayWet.gain.value = 0.3;
      this.bpf.connect(this.delay);
      this.bpf.connect(this.delayDry);
      this.delay.connect(this.delayFB);
      this.delay.connect(this.delayWet);
      this.delayFB.connect(this.delay);
      this.delayDry.connect(this.out);
      this.delayWet.connect(this.out);
      this.destination = this.out;
    }

    Khoomii.prototype.change = function() {
      return _.sample(FORMANT_PARAMS).map((function(_this) {
        return function(freq, i) {
          var time;
          freq *= (Math.random() * 0.15) + 0.925;
          time = _this.context.currentTime + 0.25;
          return _this.formants[i].frequency.linearRampToValueAtTime(freq, time);
        };
      })(this));
    };

    Khoomii.prototype.setValue = function(type, value) {
      switch (type) {
        case 'voice.freq':
          return this.voice.frequency.value = value;
        case 'voice.mod':
          return this.mod.frequency.value = value;
        case 'voice.depth':
          return this.modGain.gain.value = value;
        case 'voice.band':
          return this.bpf.frequency.value = value;
        case 'spiritual':
          return this.delayFB.gain.value = value;
      }
    };

    Khoomii.prototype.play = function() {
      this.change();
      return this.destination.connect(this.context.destination);
    };

    Khoomii.prototype.stop = function() {
      return this.destination.disconnect();
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
            return this.khoomii.setValue('voice.freq', freq);
          case 'voice.mod':
            freq = linexp(value, 1, 100, 0.05, 25);
            depth = 100 - Math.abs(value - 50) * 2;
            depth = linlin(depth, 1, 100, 1, 30);
            this.khoomii.setValue('voice.mod', freq);
            return this.khoomii.setValue('voice.depth', depth);
          case 'voice.band':
            freq = linexp(value, 1, 100, 130.8127826502993, 2 * 4186.009044809578);
            return this.khoomii.setValue('voice.band', freq);
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
        if (utils.isJp()) {
          text = _.sample(['', '', '聞いてください。', 'これが...', 'あなたに届けたい', 'みんな！聞いてくれ！！！', '最初で最後の']);
          text += _.sample(['ホーミー', 'ホーミー', '俺のホーミー', '僕のホーミー', '最高のホーミー', '君のためのホーミー', 'いつかのホーミー', 'ホーミー...', 'ホーミー (for me)']);
        } else {
          text = document.title;
        }
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
