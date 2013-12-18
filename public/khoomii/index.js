(function() {
  $(function() {
    'use strict';
    var f1, f2, f3, formants, freq, isPlaying, synth, timer;
    formants = {
      a: [700, 1200, 2900],
      i: [300, 2700, 2700],
      u: [390, 1200, 2500],
      e: [450, 1750, 2750],
      o: [460, 880, 2800]
    };
    freq = 174.61412048339844;
    freq = T("+", freq, T("sin", {
      freq: 3,
      mul: 0.8
    }).kr()).kr();
    synth = T("saw", {
      freq: freq
    });
    f1 = T("bpf", {
      freq: T("param", {
        value: 700
      }),
      Q: 9
    }, synth);
    f2 = T("bpf", {
      freq: T("param", {
        value: 1200
      }),
      Q: 9
    }, synth);
    f3 = T("bpf", {
      freq: T("param", {
        value: 2900
      }),
      Q: 9
    }, synth);
    synth = T("+", f1, f2, f3);
    synth = T("bpf", {
      freq: 3200,
      Q: 0.5
    }, synth);
    timer = T("interval", {
      interval: 250
    }, function() {
      var f;
      f = formants["aiueo"[(Math.random() * 5) | 0]];
      f1.freq.linTo(f[0], 150);
      f2.freq.linTo(f[1], 150);
      return f3.freq.linTo(f[2], 150);
    });
    isPlaying = false;
    $('#play').on('click', function() {
      isPlaying = !isPlaying;
      if (isPlaying) {
        synth.play();
        timer.start();
        return $(this).addClass('btn-active');
      } else {
        synth.pause();
        timer.pause();
        return $(this).removeClass('btn-active');
      }
    });
    return 0;
  });

}).call(this);
