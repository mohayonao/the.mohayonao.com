timbre.define("b", ["c"], function(T) {
  "use strict";
  var c = T.modules.c;
  function B() {
  }
  console.log("%cdefined B; c:" + typeof(c), "color:green");
  return B;
});
