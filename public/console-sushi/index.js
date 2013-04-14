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
          var a, b, canvas, colors, context, data, g, i, r;

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
              a = data[i + 4] / 255;
              r = ((data[i + 0] * a) + (255 * (1 - a))) | 0;
              g = ((data[i + 1] * a) + (255 * (1 - a))) | 0;
              b = ((data[i + 2] * a) + (255 * (1 - a))) | 0;
              r = ('00' + r.toString(16)).substr(-2);
              g = ('00' + g.toString(16)).substr(-2);
              b = ('00' + b.toString(16)).substr(-2);
              _results.push("color:#" + r + g + b);
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
        this.text = ((function() {
          var _i, _ref, _results;

          _results = [];
          for (i = _i = 0, _ref = this.width; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push('%c\u2588');
          }
          return _results;
        }).call(this)).join('');
        this.pad = (function() {
          var _i, _ref, _results;

          _results = [];
          for (i = _i = 0, _ref = this.width; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push('color:#ffffff');
          }
          return _results;
        }).call(this);
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
        var data, i, _i, _ref;

        console.clear();
        for (i = _i = 0, _ref = this.data.length; _i < _ref; i = _i += 1) {
          data = (this.data[i].concat(this.pad)).slice(0, this.width);
          console.log.apply(console, [this.text].concat(data));
          this.data[i].shift();
          this.data[i].push('color:#ffffff');
        }
        return 0;
      };

      return SushiLane;

    })();
    width = ((window.innerWidth - 120) / 8) | 0;
    lane = new SushiLane(width);
    setInterval(function() {
      return lane.draw();
    }, 500);
    return $('button', '#container').on('click', function() {
      var num;

      num = ($(this).attr('data-num')) | 0;
      return new SushiText(num).load().then(function(data) {
        return lane.put(data);
      });
    });
  });

}).call(this);
