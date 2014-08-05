(function() {
  $(function() {
    'use strict';
    var COORD, DISTANCE, EQ, IF, MAX_DEPTH, P2A, P2S, RADIUS, Renderer, SIZE, canvas, clip, context, expexp, explin, hash, items, linexp, linlin, path, renderer, vue;
    SIZE = 13;
    MAX_DEPTH = 65536 * 16;
    IF = function(cond, trueCase, falseCase) {
      if (cond) {
        return trueCase;
      } else {
        return falseCase;
      }
    };
    P2A = function(point) {
      return [point.x, point.y];
    };
    P2S = function(point) {
      return P2A(point).map(function(ch) {
        return String.fromCharCode(ch + 65);
      }).join('');
    };
    EQ = function(p1, p2) {
      return p1 && p2 && p1.x === p2.x && p1.y === p2.y;
    };
    DISTANCE = function(p1, p2) {
      return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    };
    RADIUS = 16;
    COORD = function(num) {
      return num * 34 + 16 + 20;
    };
    if (window.innerWidth <= 320) {
      RADIUS = 8;
      COORD = function(num) {
        return num * 17 + 8 + 10;
      };
    }
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
    explin = function(num, inMin, inMax, outMin, outMax) {
      return (((Math.log(num / inMin)) / (Math.log(inMax / inMin))) * (outMax - outMin)) + outMin;
    };
    expexp = function(num, inMin, inMax, outMin, outMax) {
      return Math.pow(outMax / outMin, Math.log(num / inMin) / Math.log(inMax / inMin)) * outMin;
    };
    Renderer = (function() {
      var draw;

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

      Renderer.prototype.generate = function(path, n) {
        var centerY, ep, lineWidth, m, size, sp, y;
        size = SIZE - 1;
        centerY = _.first(path)[1];
        this.vtx = _.rest(path).map(function(point) {
          return {
            x: point[0] / size,
            y: (point[1] - centerY) / size
          };
        });
        this.br = this.vtx.length;
        y = centerY / 12 * 600 + 40;
        sp = {
          x: 20,
          y: y
        };
        ep = {
          x: 620,
          y: y
        };
        m = Math.log(MAX_DEPTH) / Math.log(this.br);
        n = Math.max(1, Math.floor(m * n * 0.01));
        lineWidth = expexp(Math.pow(this.br, n), MAX_DEPTH, 1, 0.05, 256);
        this.context.lineWidth = lineWidth;
        this.context.lineJoin = "bevel";
        if (lineWidth >= 2) {
          this.context.beginPath();
          this.context.moveTo(sp.x, sp.y);
          this.drawFunc = (function(_this) {
            return function(sp, ep) {
              return _this.context.lineTo(ep.x, ep.y);
            };
          })(this);
          this.nextFunc = (function(_this) {
            return function(params) {
              return draw.call(_this, params);
            };
          })(this);
          this.nextFunc([sp, ep, n]);
          return this.context.stroke();
        } else {
          this.drawFunc = (function(_this) {
            return function(sp, ep) {
              _this.context.beginPath();
              _this.context.moveTo(sp.x, sp.y);
              _this.context.lineTo(ep.x, ep.y);
              return _this.context.stroke();
            };
          })(this);
          this.nextFunc = (function(_this) {
            return function(params) {
              return _this.stack.push(params);
            };
          })(this);
          this.stack = [[sp, ep, n]];
          return this.reqId = requestAnimationFrame((function(_this) {
            return function() {
              return _this.animate();
            };
          })(this));
        }
      };

      Renderer.prototype.animate = function() {
        var i, _i;
        for (i = _i = 0; _i < 256; i = ++_i) {
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

      draw = function(_arg) {
        var ep, n, pp, sp;
        sp = _arg[0], ep = _arg[1], n = _arg[2];
        if (--n < 0 || DISTANCE(sp, ep) < 0.5) {
          this.drawFunc(sp, ep);
          return;
        }
        pp = {
          x: sp.x,
          y: sp.y
        };
        return this.vtx.forEach((function(_this) {
          return function(vptr) {
            var cp;
            cp = {
              x: vptr.x * (ep.x - sp.x) - vptr.y * (ep.y - sp.y) + sp.x,
              y: vptr.x * (ep.y - sp.y) + vptr.y * (ep.x - sp.x) + sp.y
            };
            _this.nextFunc([pp, cp, n]);
            return pp = {
              x: cp.x,
              y: cp.y
            };
          };
        })(this));
      };

      return Renderer;

    })();
    renderer = new Renderer(context, canvas.width, canvas.height);
    Vue.component('editor', {
      template: '#editor-template',
      replace: true,
      components: {
        point: {
          data: {
            r: RADIUS
          },
          computed: {
            cx: function() {
              return COORD(this.x);
            },
            cy: function() {
              return COORD(this.y);
            }
          },
          methods: {
            select: function() {
              return this.$root.select(this.$data);
            },
            state: function() {
              return this.$root.state(this.$data);
            }
          }
        }
      }
    });
    vue = new Vue({
      el: '#app',
      data: {
        width: renderer.width,
        height: renderer.height,
        path: [
          {
            x: 0,
            y: 8
          }, {
            x: 4,
            y: 8
          }, {
            x: 4,
            y: 4
          }, {
            x: 8,
            y: 4
          }, {
            x: 8,
            y: 8
          }, {
            x: 12,
            y: 8
          }
        ],
        params: [
          {
            name: 'n',
            value: 75
          }, {
            name: 'h',
            value: 60
          }
        ],
        points: _.range(SIZE * SIZE).map(function(i) {
          return {
            i: i,
            x: Math.floor(i % SIZE),
            y: Math.floor(i / SIZE)
          };
        }),
        selected: []
      },
      computed: {
        svg_points: function() {
          return _.flatten(this.selected.map(P2A)).map(COORD).join(',');
        }
      },
      methods: {
        select: function(point) {
          if (!this.isTooMany() && !this.isSelected(point) && !this.isFinished()) {
            if (this.selected.length === 0 && point.x !== 0) {
              return;
            }
            if (this.selected.length <= 1 && EQ(point, this.getGoalPoint())) {
              return;
            }
            return this.selected.push(point);
          }
        },
        state: function(point) {
          if (this.isEmpty()) {
            return IF(point.x === 0, 'enabled', 'disabled');
          } else if (this.isSelected(point)) {
            return 'selected';
          } else if (this.isTooMany()) {
            return 'disabled';
          } else if (EQ(point, this.getGoalPoint())) {
            return 'goal';
          } else if (this.isFinished()) {
            return 'disabled';
          } else {
            return 'enabled';
          }
        },
        isEmpty: function() {
          return this.selected.length === 0;
        },
        isSelected: function(p1) {
          return this.selected.some((function(_this) {
            return function(p2) {
              return EQ(p1, p2);
            };
          })(this));
        },
        isTooMany: function() {
          return false;
        },
        isFinished: function() {
          return this.selected.length >= 3 && EQ(this.getGoalPoint(), _.last(this.selected));
        },
        getGoalPoint: function() {
          if (this.selected.length !== 0) {
            return this.points[(this.selected[0].y + 1) * SIZE - 1];
          }
        },
        edit: function() {
          this.selected = this.path.slice();
          return $('#editor').modal('show');
        },
        clear: function() {
          return this.selected = [];
        },
        undo: function() {
          var point;
          if (this.selected.length) {
            point = this.selected.pop();
            return this.goaled = false;
          }
        },
        ok: function() {
          return $('#editor').modal('hide').one('hidden.bs.modal', (function(_this) {
            return function() {
              if (_this.selected.length >= 3) {
                _this.path = _this.selected.map(function(point) {
                  return _.pick(point, 'x', 'y');
                });
                return _this.update();
              }
            };
          })(this));
        },
        update: _.debounce(function() {
          var h, hsv, n, _ref;
          window.location.replace("#" + vue._hash());
          _ref = _.pluck(vue.params, 'value'), n = _ref[0], h = _ref[1];
          h = linlin(h, 1, 100, 0, 360);
          hsv = Color({
            h: h,
            s: 80,
            v: 75
          });
          renderer.init(0.25, hsv.rgbString());
          return renderer.generate(vue.path.map(P2A), n);
        }, 150),
        tweet: function() {
          var text;
          text = utils.lang({
            ja: '線',
            '': document.title
          });
          return utils.tweet({
            text: text,
            url: window.location.href
          });
        },
        _hash: function() {
          return [this.path.map(P2S).join('')].concat(_.pluck(this.params, 'value')).join(',');
        }
      }
    });
    if (window.location.hash) {
      hash = decodeURIComponent(window.location.hash.substr(1));
      items = hash.split(',');
      path = items.shift();
      if (/^A([A-M])([A-M][A-M])+M\1$/.test(path)) {
        vue.path = path.match(/../g).map(function(xy) {
          var x, y;
          x = clip(xy.charCodeAt(0) - 65, 0, 12);
          y = clip(xy.charCodeAt(1) - 65, 0, 12);
          return {
            x: x,
            y: y
          };
        });
      }
      vue.params.forEach(function(param, i) {
        return param.value = clip(items[i] | 0, 1, 100);
      });
    }
    return vue.update();
  });

}).call(this);
