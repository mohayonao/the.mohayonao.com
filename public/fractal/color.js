(function() {
  "use strict";

  var color = {};

  color.hsv2rgb = function(h, s, v) {
    h = Math.max(0, Math.min(h, 360)) / 60;
    s = Math.max(0, Math.min(s, 1.0));
    v = Math.max(0, Math.min(v, 1.0));

    var r = v, g = v, b = v;
    var f = h - (h | 0);

    if (s !== 0.0) {
      switch (h | 0) {
        case 0:
          g *= 1 - s * (1 - f);
          b *= 1 - s;
          break;
        case 1:
          r *= 1 - s * f;
          b *= 1 - s;
          break;
        case 2:
          r *= 1 - s;
          b *= 1 - s * (1 - f);
          break;
        case 3:
          r *= 1 - s;
          g *= 1 - s * f;
          break;
        case 4:
          r *= 1 - s * (1 - f);
          g *= 1 - s;
          break;
        case 5:
          g *= 1 - s;
          b *= 1 - s * f;
      }
    }

    return [ r, g, b ].map(function(x) {
      return Math.round(x * 255);
    });
  };

  window.color = color;
})();
