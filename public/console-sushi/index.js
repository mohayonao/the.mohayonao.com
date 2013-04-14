(function() {
  $(function() {
    'use strict';
    var ImageLoader, SushiLane, SushiText, lane, width;

    ImageLoader = (function() {
      var map;

      map = {};

      function ImageLoader() {
        this.dfd = $.Deferred();
      }

      ImageLoader.prototype.load = function(num) {
        this.num = num;
        if (!map[this.num]) {
          map[this.num] = this;
        }
        return map[this.num]._load();
      };

      ImageLoader.prototype._load = function() {
        var img,
          _this = this;

        img = new Image;
        img.src = "/lib/img/sushi/" + (('000' + this.num).substr(-3)) + ".png";
        img.onload = function() {
          return _this.dfd.resolve(img);
        };
        this._load = function() {
          return _this.dfd.promise();
        };
        return this.dfd.promise();
      };

      return ImageLoader;

    })();
    SushiText = (function() {
      function SushiText(num, width, height) {
        this.num = num;
        this.width = width != null ? width : 29;
        this.height = height != null ? height : 24;
      }

      SushiText.prototype.load = function() {
        var dfd,
          _this = this;

        dfd = $.Deferred();
        new ImageLoader().load(this.num).then(function(img) {
          var b, canvas, colors, context, data, g, i, r;

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
              r = ('00' + data[i + 0].toString(16)).substr(-2);
              g = ('00' + data[i + 1].toString(16)).substr(-2);
              b = ('00' + data[i + 2].toString(16)).substr(-2);
              _results.push("#" + r + g + b);
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
        });
        return dfd.promise();
      };

      return SushiText;

    })();
    SushiLane = (function() {
      function SushiLane(width, height) {
        var i;

        this.width = width != null ? width : 128;
        this.height = height != null ? height : 24;
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
        var css, data, items, j, list, val, _i, _len;

        list = (function() {
          var _i, _j, _len, _ref, _ref1, _results;

          _ref = this.data;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            data = _ref[_i];
            val = [];
            css = [];
            for (j = _j = 0, _ref1 = Math.min(data.length, this.width); _j < _ref1; j = _j += 1) {
              if (data[j] !== data[j - 1]) {
                val.push('%c');
                css.push("color:" + data[j]);
              }
              val.push('\u2588');
            }
            if (css[css.length - 1] === 'color:#ffffff') {
              val.splice(val.lastIndexOf('%c'));
              css.pop();
            }
            data.splice(0, 3);
            _results.push([val.join('')].concat(css));
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
    width = ((window.innerWidth - 120) / 8) | 0;
    lane = new SushiLane(width);
    setInterval(function() {
      return lane.draw();
    }, 750);
    return $('button', '#container').on('click', function() {
      var num;

      num = ($(this).attr('data-num')) | 0;
      return new SushiText(num).load().then(function(data) {
        return lane.put(data);
      });
    });
  });

}).call(this);
