(function() {
  'use strict';
  var Tarai, app, baseRoot, car, clip, master, pattern, scale, synth, tarai, timer, vue;

  clip = function(num, min, max) {
    return Math.max(min, Math.min(num, max));
  };

  Tarai = (function() {
    function Tarai() {}

    Tarai.prototype.init = function(x, y, z) {
      this.list = [];
      this.index = 0;
      return this.tarai(x, y, z);
    };

    Tarai.prototype.tarai = function(x, y, z) {
      this.list.push([x, y, z]);
      if (x <= y) {
        return y;
      } else {
        return this.tarai(this.tarai(x - 1, y, z), this.tarai(y - 1, z, x), this.tarai(z - 1, x, y));
      }
    };

    Tarai.prototype.fetch = function() {
      return this.list[this.index++];
    };

    Tarai.prototype.reset = function() {
      return this.index = 0;
    };

    return Tarai;

  })();

  tarai = new Tarai;

  scale = new sc.Scale([0, 2, 3, 7, 9], 12, 'Kumoi');

  baseRoot = 62;

  pattern = [0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 1, 1];

  car = [];

  synth = T('PluckGen');

  master = T('chorus', {
    delay: 4,
    rate: 1,
    depth: 40
  }, synth);

  master = T('delay', {
    time: 'bpm120 l8.',
    fb: 0.4,
    mix: 0.3
  }, master);

  timer = T('interval', {
    interval: 'bpm120 l16'
  }, function(count) {
    var i, noteNum, p, _ref;
    i = count & 15;
    if (i === 0) {
      car = (_ref = tarai.fetch()) != null ? _ref.sort() : void 0;
    }
    if (car) {
      p = pattern[i];
      i = car[p];
      switch (p) {
        case 0:
          vue.x = clip(i, 0, 10);
          break;
        case 1:
          vue.y = clip(i, 0, 10);
          break;
        case 2:
          vue.z = clip(i, 0, 10);
      }
      noteNum = Math.round(scale.performDegreeToKey(i)) + baseRoot;
      noteNum += 12 * (count % 2);
      return synth.noteOn(noteNum, 100);
    }
  });

  app = new ((function() {
    function _Class() {
      this.isPlaying = false;
    }

    _Class.prototype.init = function(x, y, z) {
      return tarai.init(x, y, z);
    };

    _Class.prototype.play = function() {
      this.isPlaying = true;
      tarai.reset();
      master.play();
      return timer.start();
    };

    _Class.prototype.stop = function() {
      this.isPlaying = false;
      master.pause();
      return timer.stop();
    };

    return _Class;

  })());

  vue = new Vue({
    el: '#app',
    data: {
      x: 10,
      y: 5,
      z: 0,
      xs: _.range(11).map(function(x) {
        return {
          value: x
        };
      }),
      ys: _.range(11).map(function(y) {
        return {
          value: y
        };
      }),
      zs: _.range(11).map(function(z) {
        return {
          value: z
        };
      }),
      isPlaying: app.isPlaying
    },
    methods: {
      play: function() {
        if (app.isPlaying) {
          app.stop();
        } else {
          window.location.replace("#" + this.x + "," + this.y + "," + this.z);
          app.init(this.x, this.y, this.z);
          app.play();
        }
        return this.isPlaying = app.isPlaying;
      },
      stop: function() {
        if (app.isPlaying) {
          app.stop();
        }
        return this.isPlaying = app.isPlaying;
      },
      tweet: function() {
        var text, url, x, y, z;
        x = clip(this.x, 0, 10);
        y = clip(this.y, 0, 10);
        z = clip(this.z, 0, 10);
        text = 'tarai-music';
        url = "http://" + location.host + "/tarai/#" + x + "," + y + "," + z;
        return utils.tweet({
          text: text,
          url: url
        });
      }
    }
  });

  window.onhashchange = function() {
    var items;
    items = decodeURI(location.hash.substr(1).trim()).split(',');
    vue.x = clip(items[0] | 0, 0, 10);
    vue.y = clip(items[1] | 0, 0, 10);
    return vue.z = clip(items[2] | 0, 0, 10);
  };

  if (location.hash) {
    window.onhashchange();
  }

}).call(this);
