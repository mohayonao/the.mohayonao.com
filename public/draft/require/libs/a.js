timbre.define("a", ["b","c"], function(T) {
  "use strict";
  var b = T.modules.b;
  var c = T.modules.c;
  function A() {
  }
  console.log("%cdefined A; b:" + typeof(b) + ", c:" + typeof(c), "color:green");
  return A;
});
