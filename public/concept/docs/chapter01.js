(function() {
  var a, freq, pan;

  goto("index");

  _.zip(pan = [-1, +1], freq = [2, 3]).map(function(_arg) {
    var freq, pan;

    pan = _arg[0], freq = _arg[1];
    return console.log(pan, freq);
  });

  a = stomp.SinOsc().play();

  a = stomp.SinOsc({
    freq: 880,
    mul: stomp.SinOsc(1)
  }).play();

  a = stomp.SinOsc(880).mul(stomp.SinOsc(1)).play();

  a.pause();

  goto("index");

  reload(true);

}).call(this);
