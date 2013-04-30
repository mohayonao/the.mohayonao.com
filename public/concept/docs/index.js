/*

 timbre.js - the concept book
*/


(function() {
  T("sin.ar", {
    mul: 0.5
  }).play();

  T("sin.ar", {
    freq: T("param.kr", {
      value: 440
    }).linTo(880, "2sec"),
    mul: 0.5
  }).play();

  goto("chapter01");

  goto("chapter02");

  goto("chapter03");

  goto("extra-examples-01");

}).call(this);
