(function() {
  $(function() {
    'use strict';
    var Renderer, canvas, clip, context, hash, items, linexp, linlin, renderer, vue;
    canvas = document.getElementById('canvas');
    canvas.width = 640;
    canvas.height = 640;
    context = canvas.getContext('2d');
    clip = function(num, min, max) {
      return Math.max(min, Math.min(num, max));
    };
    linlin = function(num, inMin, inMax, outMin, outMax) {
      return (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
    };
    linexp = function(num, inMin, inMax, outMin, outMax) {
      return Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin;
    };
    Renderer = (function() {
      var circle, draw;

      function Renderer(context, width, height) {
        this.context = context;
        this.width = width;
        this.height = height;
        this.reqId = 0;
        this.stack = [];
      }

      Renderer.prototype.init = function(lineWidth, color) {
        this.clear();
        this.context.lineWidth = lineWidth;
        return this.context.strokeStyle = color;
      };

      Renderer.prototype.clear = function() {
        cancelAnimationFrame(this.reqId);
        context.clearRect(0, 0, this.width, this.height);
        this.reqId = 0;
        return this.stack = [];
      };

      Renderer.prototype.generate = function(x, y, r, sr, br, n) {
        sr = linexp(sr, 100, 1, 1, 8.0);
        br = linlin(br, 1, 100, 1, 100) | 0;
        n = linlin(n, 1, 100, 2, 12) | 0;
        this.stack = [[x, y, r, sr, br, n]];
        return this.reqId = requestAnimationFrame((function(_this) {
          return function() {
            return _this.animate();
          };
        })(this));
      };

      Renderer.prototype.animate = function() {
        var i, _i;
        for (i = _i = 0; _i <= 256; i = ++_i) {
          if (this.stack.length === 0) {
            break;
          }
          draw.call(this, this.stack.pop());
        }
        if (this.stack.length !== 0) {
          return this.reqId = requestAnimationFrame((function(_this) {
            return function() {
              return _this.animate();
            };
          })(this));
        }
      };

      circle = function(context, x, y, r) {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, true);
        context.closePath();
        return context.stroke();
      };

      draw = function(_arg) {
        var br, k, n, nr, nx, ny, r, sr, th, x, y, _i;
        x = _arg[0], y = _arg[1], r = _arg[2], sr = _arg[3], br = _arg[4], n = _arg[5];
        circle(this.context, this.width * 0.5 + x, this.height * 0.5 - y, r);
        nr = r / sr;
        if (n > 1 && nr > 0.5) {
          th = Math.PI * 2.0 / br;
          for (k = _i = 0; _i < br; k = _i += 1) {
            nx = nr * (sr - 1.0) * Math.cos(th * k) + x;
            ny = nr * (sr - 1.0) * Math.sin(th * k) + y;
            this.stack.push([nx, ny, nr, sr, br, n - 1]);
          }
          return null;
        }
      };

      return Renderer;

    })();
    renderer = new Renderer(context, canvas.width, canvas.height);
    vue = new Vue({
      el: '#app',
      data: {
        width: renderer.width,
        height: renderer.height,
        params: [
          {
            label: 'sr',
            value: 67
          }, {
            label: 'br',
            value: 80
          }, {
            label: 'n',
            value: 10
          }, {
            label: 'h',
            value: 50
          }
        ]
      },
      methods: {
        update: function() {
          var br, h, hsv, n, params, sr;
          params = _.pluck(this.params, 'value');
          window.location.replace("#" + params.join(','));
          sr = params[0], br = params[1], n = params[2], h = params[3];
          h = linlin(h, 1, 100, 0, 360);
          hsv = Color({
            h: h,
            s: 80,
            v: 60
          });
          renderer.init(0.2, hsv.rgbString());
          return renderer.generate(0, 0, 300, sr, br, n);
        },
        tweet: function() {
          var text;
          text = utils.lang({
            ja: '円',
            '': document.title
          });
          return utils.tweet({
            text: text,
            url: window.location.href
          });
        }
      }
    });
    if (window.location.hash) {
      hash = decodeURIComponent(window.location.hash.substr(1));
      items = hash.split(',');
      vue.params.forEach(function(param, i) {
        return param.value = clip(items[i] | 0, 1, 100);
      });
    }
    return vue.update();
  });

}).call(this);
