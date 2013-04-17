(function() {
  $(function() {
    'use strict';
    var IMAGE_NUM, ImageLoader, OBJECT_NUM, SUSHI_SIZE, Sushi, canvas, context, i, objects, rand;

    OBJECT_NUM = 200;
    IMAGE_NUM = 75;
    SUSHI_SIZE = 20;
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
        var img,
          _this = this;

        img = new Image;
        img.src = this.src;
        img.onload = function() {
          return _this.dfd.resolve(img);
        };
        this.load = function() {
          return _this.dfd.promise();
        };
        return this.load();
      };

      return ImageLoader;

    })();
    Sushi = (function() {
      function Sushi(num, x, y, z) {
        var src,
          _this = this;

        this.num = num;
        this.x = x;
        this.y = y;
        this.z = z;
        src = "/lib/img/sushi/" + (('000' + this.num).substr(-3)) + ".png";
        new ImageLoader(src).load().then(function(img) {
          return _this.img = img;
        });
      }

      Sushi.prototype.draw = function(context) {
        var size, x, y;

        if (!this.img) {
          return;
        }
        size = this.z * SUSHI_SIZE;
        x = this.x - size * 0.5;
        y = this.y - size * 0.5;
        return context.drawImage(this.img, 0, 0, this.img.width, this.img.height, x, y, size, size);
      };

      return Sushi;

    })();
    rand = function(min, max) {
      var _ref;

      if (max == null) {
        _ref = [0, min], min = _ref[0], max = _ref[1];
      }
      return Math.random() * (max - min) + min;
    };
    canvas = document.getElementById('canvas');
    canvas.width = $(canvas).width();
    canvas.height = $(canvas).height();
    context = canvas.getContext('2d');
    objects = (function() {
      var _i, _results;

      _results = [];
      for (i = _i = 0; _i < OBJECT_NUM; i = _i += 1) {
        _results.push(new Sushi(rand(IMAGE_NUM) | 0, rand(canvas.width), rand(-canvas.height, canvas.height), rand(0.25, 3.00)));
      }
      return _results;
    })();
    objects.sort(function(a, b) {
      return a.z - b.z;
    });
    return apps.animate({
      fps: 40
    }, function(now, dt) {
      var o, _i, _results;

      context.clearRect(0, 0, canvas.width, canvas.height);
      _results = [];
      for (i = _i = 0; _i < OBJECT_NUM; i = _i += 1) {
        o = objects[i];
        o.x += rand(-1, 1);
        o.y += o.z * dt * 0.1;
        o.draw(context);
        if (o.y > canvas.height + SUSHI_SIZE * 5) {
          _results.push(objects[i] = new Sushi(rand(IMAGE_NUM) | 0, rand(canvas.width), SUSHI_SIZE * -5, o.z));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
  });

}).call(this);
