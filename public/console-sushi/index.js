(function() {
  $(function() {
    'use strict';
    var ImageLoader, SushiLane, SushiText, lane, width;
    ImageLoader = (function() {
      var map;

      map = {};

      function ImageLoader(src) {
        this.src = src;
        if (!map[this.src]) {
          this.dfd = new $.Deferred;
          map[this.src] = this;
        }
        return map[this.src];
      }

      ImageLoader.prototype.load = function() {
        var img;
        img = new Image;
        img.src = this.src;
        img.onload = (function(_this) {
          return function() {
            return _this.dfd.resolve(img);
          };
        })(this);
        this.load = (function(_this) {
          return function() {
            return _this.dfd.promise();
          };
        })(this);
        return this.load();
      };

      return ImageLoader;

    })();
    SushiText = (function() {
      function SushiText(num, width, height) {
        this.num = num;
        this.width = width != null ? width : 35;
        this.height = height != null ? height : 20;
      }

      SushiText.prototype.load = function() {
        var dfd, src;
        dfd = $.Deferred();
        src = "/lib/img/sushi/" + (('000' + this.num).substr(-3)) + ".png";
        new ImageLoader(src).load().then((function(_this) {
          return function(img) {
            var canvas, colors, context, data, i;
            canvas = document.createElement('canvas');
            canvas.width = _this.width;
            canvas.height = _this.height;
            context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
            data = context.getImageData(0, 0, canvas.width, canvas.height).data;
            colors = (function() {
              var _i, _ref, _results;
              _results = [];
              for (i = _i = 0, _ref = data.length - 4; _i < _ref; i = _i += 4) {
                _results.push((data[i] << 16) + (data[i + 1] << 8) + data[i + 2]);
              }
              return _results;
            })();
            data = (function() {
              var _i, _ref, _results;
              _results = [];
              for (i = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                _results.push(colors.splice(0, this.width));
              }
              return _results;
            }).call(_this);
            return dfd.resolve(data);
          };
        })(this));
        return dfd.promise();
      };

      return SushiText;

    })();
    SushiLane = (function() {
      function SushiLane(width, height) {
        var i;
        this.width = width != null ? width : 128;
        this.height = height != null ? height : 20;
        this.data = (function() {
          var _i, _ref, _results;
          _results = [];
          for (i = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push([]);
          }
          return _results;
        }).call(this);
      }

      SushiLane.prototype.put = function(data) {
        var i, _i, _ref;
        for (i = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          this.data[i] = this.data[i].concat(data[i]);
        }
        return 0;
      };

      SushiLane.prototype.draw = function() {
        var css, data, i, items, j, list, val, _i, _len;
        list = (function() {
          var _i, _j, _len, _ref, _ref1, _results;
          _ref = this.data;
          _results = [];
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            data = _ref[i];
            val = [];
            css = [];
            for (j = _j = 0, _ref1 = Math.min(data.length, this.width); _j < _ref1; j = _j += 1) {
              if (data[j] !== data[j - 1]) {
                val.push('%c');
                css.push(data[j]);
              }
              val.push('\u2588');
            }
            if (css[css.length - 1] === 0xffffff) {
              val.splice(val.lastIndexOf('%c'));
              css.pop();
            }
            val.push("%c" + i);
            css.push(0xffffff);
            data.splice(0, 3);
            _results.push([val.join('')].concat(css.map(function(x) {
              return "color:#" + (('000000' + x.toString(16)).substr(-6));
            })));
          }
          return _results;
        }).call(this);
        console.clear();
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          items = list[_i];
          console.log.apply(console, items);
        }
        return 0;
      };

      return SushiLane;

    })();
    width = ((window.innerWidth - 90) / 8) | 0;
    lane = new SushiLane(width);
    setInterval(function() {
      return lane.draw();
    }, 750);
    return $('button', '#unit').on('click', function() {
      var num;
      num = ($(this).attr('data-num')) | 0;
      return new SushiText(num).load().then(function(data) {
        return lane.put(data);
      });
    });
  });

}).call(this);
