(function() {
  var a, b, c, d;

  a = T("audio", {
    load: "amen.wav",
    loop: true
  });

  b = T("lpf");

  c = T("comp");

  d = T("delay");

  a.to(d).to(c).play();

  a.splice(b, c, d);

  a.to(c).play();

  a.splice(b, c);

}).call(this);
