(function() {
  $(function() {
    'use strict';
    var Tarai, baseRoot, car, isPlaying, master, pattern, scale, synth, tarai, timer;

    sc.use('prototype');
    Array.prototype.sorted = function() {
      this.sort();
      return this;
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
    tarai.init(10, 5, 0);
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
      var i, noteNum, _ref;

      count &= 15;
      if (count === 0) {
        car = (_ref = tarai.fetch()) != null ? _ref.sorted() : void 0;
      }
      if (car) {
        i = car[pattern[count]];
        noteNum = Math.round(scale.performDegreeToKey(i)) + baseRoot;
        noteNum += 12 * (count % 2);
        return synth.noteOn(noteNum, 100);
      }
    });
    isPlaying = false;
    return $('#play').on('click', function() {
      isPlaying = !isPlaying;
      if (isPlaying) {
        tarai.reset();
        master.play();
        timer.start();
        return $(this).css('color', 'red');
      } else {
        master.pause();
        timer.stop();
        return $(this).css('color', 'black');
      }
    });
  });

}).call(this);
