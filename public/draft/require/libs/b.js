timbre.define("b", ["c"], function(T) {
  "use strict";
  var c = T.require("c");
  console.log("load B; c:" + typeof(c));
  function B() {
    B.b = "b";
    B.c = c;
  }
  return B;
});
