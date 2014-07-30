(function() {
  $(function() {
    'use strict';
    var animate, canvas, circle, context, hsv2rgb, in_circle, linexp, linlin, queue, reqId, update;
    canvas = document.getElementById('canvas');
    canvas.width = 640;
    canvas.height = 640;
    context = canvas.getContext('2d');
    circle = function(x, y, r) {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2, true);
      context.closePath();
      return context.stroke();
    };
    reqId = 0;
    queue = [];
    animate = function() {
      var br, f, i, n, r, sr, x, y, _i;
      for (i = _i = 0; _i <= 256; i = ++_i) {
        f = queue.pop();
        if (_.isFunction(f)) {
          f();
        } else if (_.isArray(f)) {
          x = f[0], y = f[1], r = f[2], sr = f[3], br = f[4], n = f[5];
          in_circle(x, y, r, sr, br, n);
        }
      }
      if (queue.length !== 0) {
        return reqId = requestAnimationFrame(animate);
      }
    };
    in_circle = function(x, y, r, sr, br, n) {
      if (--n < 0 || r < 2) {
        return;
      }
      circle(320 + x, 320 - y, r);
      return (function(x, y, r, sr, br, n) {
        return queue.push(function() {
          var k, nr, nx, ny, th, _i, _results;
          th = Math.PI * 2.0 / br;
          _results = [];
          for (k = _i = 0; _i < br; k = _i += 1) {
            nr = r / sr;
            nx = nr * (sr - 1.0) * Math.cos(th * k) + x;
            ny = nr * (sr - 1.0) * Math.sin(th * k) + y;
            _results.push(queue.push([nx, ny, nr, sr, br, n - 1]));
          }
          return _results;
        });
      })(x, y, r, sr, br, n);
    };
    linlin = function(num, inMin, inMax, outMin, outMax) {
      return (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
    };
    linexp = function(num, inMin, inMax, outMin, outMax) {
      return Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin;
    };
    hsv2rgb = function(h, s, v) {
      var b, f, g, r;
      r = g = b = v;
      if (s !== 0.0) {
        h = h * 6;
        f = h - (h | 0);
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
      return [r, g, b].map(function(x) {
        return Math.round(x * 255);
      });
    };
    update = function() {
      var br, h, n, sr;
      cancelAnimationFrame(reqId);
      context.clearRect(0, 0, canvas.width, canvas.height);
      sr = Math.max(1, Math.min($('#sr').val(), 100));
      br = Math.max(1, Math.min($('#br').val(), 100));
      n = Math.max(2, Math.min($('#n').val(), 12));
      h = Math.max(1, Math.min($('#h').val(), 100));
      sr = linexp(sr, 100, 1, 1.0, 10.0);
      h = linlin(h, 0, 100, 0, 1.0);
      context.strokeStyle = "rgb(" + hsv2rgb(h, 0.5, 0.8).join(',') + ")";
      queue = [[0, 0, 300, sr, br, n]];
      return reqId = requestAnimationFrame(animate);
    };
    update();
    $('#sr').on('input', update);
    $('#br').on('input', update);
    $('#n').on('input', update);
    return $('#h').on('input', update);
  });

}).call(this);
