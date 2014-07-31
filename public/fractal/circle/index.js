(function() {
  $(function() {
    'use strict';
    var Application, app, canvas, clip, context, hash, items, linexp, linlin, vue;
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
    Application = (function() {
      var animate, circle, next;

      function Application(context, width, height) {
        this.context = context;
        this.width = width;
        this.height = height;
        this.reqId = 0;
        this.stack = [];
      }

      Application.prototype.init = function(width, color) {
        this.clear();
        this.context.lineWidth = width;
        return this.context.strokeStyle = color;
      };

      Application.prototype.clear = function() {
        cancelAnimationFrame(this.reqId);
        context.clearRect(0, 0, this.width, this.height);
        this.reqId = 0;
        return this.stack = [];
      };

      Application.prototype.generate = function(x, y, r, sr, br, n) {
        this.stack = [[next, x, y, r, sr, br, n]];
        return this.reqId = requestAnimationFrame((function(_this) {
          return function() {
            return animate.call(_this);
          };
        })(this));
      };

      circle = function(context, x, y, r) {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, true);
        context.closePath();
        return context.stroke();
      };

      animate = function() {
        var func, i, items, _i;
        for (i = _i = 0; _i <= 256; i = ++_i) {
          if (this.stack.length === 0) {
            break;
          }
          items = this.stack.pop();
          func = _.first(items);
          func.apply(this, _.rest(items));
        }
        if (this.stack.length !== 0) {
          return this.reqId = requestAnimationFrame((function(_this) {
            return function() {
              return animate.call(_this);
            };
          })(this));
        }
      };

      next = function(x, y, r, sr, br, n) {
        var func, nr;
        circle(this.context, this.width * 0.5 + x, this.height * 0.5 - y, r);
        nr = r / sr;
        if (n > 1 && nr > 2) {
          func = (function(_this) {
            return function(x, y, nr, sr, br, n) {
              var k, nx, ny, th, _i, _results;
              th = Math.PI * 2.0 / br;
              _results = [];
              for (k = _i = 0; _i < br; k = _i += 1) {
                nx = nr * (sr - 1.0) * Math.cos(th * k) + x;
                ny = nr * (sr - 1.0) * Math.sin(th * k) + y;
                _results.push(_this.stack.push([next, nx, ny, nr, sr, br, n - 1]));
              }
              return _results;
            };
          })(this);
          return this.stack.push([func, x, y, nr, sr, br, n]);
        }
      };

      return Application;

    })();
    app = new Application(context, canvas.width, canvas.height);
    vue = new Vue({
      el: '#app',
      data: {
        width: app.width,
        height: app.height,
        params: [
          {
            label: 'sr',
            value: 64
          }, {
            label: 'br',
            value: 36
          }, {
            label: 'n',
            value: 5
          }, {
            label: 'h',
            value: 1
          }
        ]
      },
      methods: {
        update: function() {
          var br, h, hsv, n, sr, _ref;
          _ref = vue.getParams(), sr = _ref[0], br = _ref[1], n = _ref[2], h = _ref[3];
          hsv = color.hsv2rgb(h, 0.5, 0.8);
          app.init(0.2, "rgb(" + hsv.join(',') + ")");
          return app.generate(0, 0, 300, sr, br, n);
        },
        getParams: function() {
          var br, h, n, sr;
          sr = clip(this.params[0].value, 1, 100);
          br = clip(this.params[1].value, 1, 100);
          n = clip(this.params[2].value, 1, 100);
          h = clip(this.params[3].value, 1, 100);
          window.location.replace("#" + [sr, br, n, h].join(','));
          sr = linexp(sr, 100, 1, 1.0, 10.0);
          br = br | 0;
          n = linlin(n, 1, 100, 2, 24) | 0;
          h = linlin(h, 1, 100, 0, 360);
          return [sr, br, n, h];
        }
      }
    });
    if (window.location.hash) {
      hash = decodeURIComponent(window.location.hash.substr(1));
      items = hash.split(',');
      vue.params[0].value = items[0] | 0;
      vue.params[1].value = items[1] | 0;
      vue.params[2].value = items[2] | 0;
      vue.params[3].value = items[3] | 0;
    }
    return vue.update();
  });

}).call(this);
