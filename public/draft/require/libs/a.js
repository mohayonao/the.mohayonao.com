timbre.define("a", ["b","c"], function(T) {
  "use strict";
  var b = T.require("b");
  var c = T.require("c");
  console.log("load A; b:" + typeof(b) + ", c:" + typeof(c));
  function A() {
    A.a = "a";
    A.b = b;
    A.c = c;
  }
  return A;
});
