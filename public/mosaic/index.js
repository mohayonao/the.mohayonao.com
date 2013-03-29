(function() {
  $(function() {
    'use strict';
    var $btn, $msg, Application, BLACK, Editor, GRAY, NAVY, SIZE, app, conf_mode, drag_mode, dst, exec_mode, mask_mode, save_mode, src, trim_mode;

    SIZE = 400;
    BLACK = '#302833';
    NAVY = '#223a70';
    GRAY = '#c0c6c9';
    Array.prototype.choose = function() {
      return this[(Math.random() * this.length) | 0];
    };
    String.prototype.times = function(n) {
      var i;

      return ((function() {
        var _i, _results;

        _results = [];
        for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
          _results.push(this);
        }
        return _results;
      }).call(this)).join('');
    };
    Editor = (function() {
      var setEventListener;

      function Editor(elem) {
        this.elem = elem;
        this.context = this.elem.getContext('2d');
        this.width = this.elem.width;
        this.height = this.elem.height;
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
        this.image = null;
        this.mode = 'drag';
        this.position = {
          x: 0,
          y: 0
        };
        this.zoom = 1;
        this.mask = {
          size: 10,
          xmax: 0,
          ymax: 0,
          value: 1,
          data: new Uint8Array(0)
        };
        setEventListener.call(this, this.elem);
      }

      Editor.prototype.setImage = function(image) {
        this.image = image;
        this.image.halfWidth = this.image.width * 0.5;
        this.image.halfHeight = this.image.height * 0.5;
        this.position = {
          x: 0,
          y: 0
        };
        this.zoom = Math.max(this.width / this.image.width, this.height / this.image.height);
        this.mask.xmax = (this.width / this.mask.size) | 0;
        this.mask.ymax = (this.height / this.mask.size) | 0;
        this.mask.data = new Uint8Array(this.mask.xmax * this.mask.ymax);
        return this.draw();
      };

      Editor.prototype.getImage = function() {
        return this.image;
      };

      Editor.prototype.setMode = function(value) {
        return this.mode = value;
      };

      Editor.prototype.getMode = function() {
        return this.mode;
      };

      Editor.prototype.setZoom = function(value) {
        var zoom;

        zoom = Math.max(0, Math.min(value, 4));
        if (this.width <= this.image.width * zoom && this.height <= this.image.height * zoom) {
          this.zoom = zoom;
          return this.move(0, 0);
        }
      };

      Editor.prototype.getZoom = function() {
        return this.zoom;
      };

      Editor.prototype.setMaskValue = function(value) {
        return this.mask.value = value;
      };

      Editor.prototype.getMaskValue = function() {
        return this.mask.value;
      };

      Editor.prototype.move = function(dx, dy) {
        var hh, hw, x, y, z;

        if (this.image) {
          z = 1 / this.zoom;
          x = this.position.x + dx * z;
          y = this.position.y + dy * z;
          hw = this.image.halfWidth - this.halfWidth * z;
          hh = this.image.halfHeight - this.halfHeight * z;
          if (x < -hw) {
            x = -hw;
          }
          if (+hw < x) {
            x = +hw;
          }
          if (y < -hh) {
            y = -hh;
          }
          if (+hh < y) {
            y = +hh;
          }
          this.position.x = x;
          this.position.y = y;
          return this.draw();
        }
      };

      Editor.prototype.paint = function(_x, _y) {
        var index, x, y;

        x = (_x / this.mask.size) | 0;
        y = (_y / this.mask.size) | 0;
        index = y * this.mask.xmax + x;
        if (this.mask.data[index] !== this.mask.value) {
          this.mask.data[index] = this.mask.value;
          return this.draw();
        }
      };

      Editor.prototype.getImageData = function() {
        var sh, sw, sx, sy, x1, x2, y1, y2, z, _ref;

        if (this.image) {
          z = 1 / this.zoom;
          x1 = (this.image.halfWidth - this.halfWidth * z) + this.position.x;
          y1 = (this.image.halfHeight - this.halfHeight * z) + this.position.y;
          x2 = x1 + this.width * z;
          y2 = y1 + this.height * z;
          _ref = [x1, y1, x2 - x1, y2 - y1], sx = _ref[0], sy = _ref[1], sw = _ref[2], sh = _ref[3];
          this.context.drawImage(this.image, sx, sy, sw, sh, 0, 0, this.width, this.height);
          return this.context.getImageData(0, 0, this.width, this.height);
        }
      };

      Editor.prototype.draw = function() {
        var i, imageData, x, y, _i, _ref;

        this.context.save();
        if (this.image) {
          imageData = this.getImageData();
          this.context.putImageData(imageData, 0, 0);
        } else {
          imageData = null;
        }
        this.context.fillStyle = '#000';
        for (i = _i = 0, _ref = this.mask.data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (this.mask.data[i]) {
            x = ((i % this.mask.xmax) | 0) * this.mask.size;
            y = ((i / this.mask.xmax) | 0) * this.mask.size;
            this.context.fillRect(x, y, this.mask.size, this.mask.size);
          }
        }
        this.context.restore();
        return imageData;
      };

      Editor.prototype.write = function(imageData) {
        return this.context.putImageData(imageData, 0, 0);
      };

      setEventListener = function(elem) {
        var $elem,
          _this = this;

        $elem = $(elem);
        $elem.on('mousedown', function(e) {
          var x, y, _ref;

          _ref = [e.offsetX, e.offsetY], x = _ref[0], y = _ref[1];
          switch (_this.mode) {
            case 'mask':
              _this.paint(x, y);
          }
          _this.mousedown = {
            x: x,
            y: y
          };
          e.preventDefault();
          return e.stopPropagation();
        });
        $elem.on('mousemove', function(e) {
          var dx, dy, x, y, _ref;

          _ref = [e.offsetX, e.offsetY], x = _ref[0], y = _ref[1];
          if (_this.mousedown) {
            switch (_this.mode) {
              case 'trim':
                dx = _this.mousedown.x - x;
                dy = _this.mousedown.y - y;
                _this.move(dx, dy);
                break;
              case 'mask':
                _this.paint(x, y);
            }
            return _this.mousedown = {
              x: e.offsetX,
              y: e.offsetY
            };
          }
        });
        $elem.on('mouseup', function() {
          return _this.mousedown = null;
        });
        return $elem.on('mouseout', function() {
          return _this.mousedown = null;
        });
      };

      return Editor;

    })();
    $msg = $('#msg');
    $btn = $('.button');
    $btn.set = function(list) {
      return list.forEach(function(items, i) {
        $($btn[i]).attr('title', items.icon);
        $($btn[i]).css('color', items.enabled ? BLACK : GRAY);
        return $btn[i].cmd = items.cmd;
      });
    };
    Application = (function() {
      var FRAMES, SPEED, mosaic;

      FRAMES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

      SPEED = [10, 20, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

      function Application(src, dst) {
        this.editor = new Editor(src);
        this.result = dst;
        this.prev_mode = null;
        this.next_mode = null;
        this.frames = 8;
        this.speed = 100;
      }

      Application.prototype.setImage = function(file) {
        var reader,
          _this = this;

        if (file && typeof file.type === 'string' && file.type.substr(0, 5) === 'image') {
          reader = new FileReader;
          reader.onload = function() {
            var image;

            image = new Image;
            image.onload = function() {
              return _this.editor.setImage(image);
            };
            return image.src = reader.result;
          };
          reader.readAsDataURL(file);
        }
        return true;
      };

      Application.prototype.getImage = function() {
        return this.editor.getImage();
      };

      Application.prototype.setMode = function(value) {
        this.editor.setMode(value);
        switch (value) {
          case 'drag':
            return drag_mode();
          case 'trim':
            return trim_mode();
          case 'mask':
            return mask_mode();
          case 'conf':
            return conf_mode();
          case 'exec':
            return exec_mode();
          case 'save':
            return save_mode();
        }
      };

      Application.prototype.getMode = function() {
        return this.editor.getMode();
      };

      Application.prototype.setZoom = function(value) {
        return this.editor.setZoom(value);
      };

      Application.prototype.getZoom = function() {
        return this.editor.getZoom();
      };

      Application.prototype.setMaskValue = function(value) {
        return this.editor.setMaskValue(value);
      };

      Application.prototype.getMaskValue = function() {
        return this.editor.getMaskValue();
      };

      Application.prototype.setConfig = function(key, ch) {
        var index;

        switch (key) {
          case 'frames':
            index = (FRAMES.indexOf(this.frames)) + ch;
            if ((0 <= index && index < FRAMES.length)) {
              return this.frames = FRAMES[index];
            }
            break;
          case 'speed':
            index = (SPEED.indexOf(this.speed)) + ch;
            if ((0 <= index && index < SPEED.length)) {
              return this.speed = SPEED[index];
            }
        }
      };

      Application.prototype.getConfig = function(key) {
        switch (key) {
          case 'frames':
            return this.frames;
          case 'speed':
            return this.speed;
        }
      };

      Application.prototype.generate = function() {
        var canvas, context, dfd, encoder, i, mask, processed, progress, saved, _i, _ref,
          _this = this;

        dfd = $.Deferred();
        saved = this.editor.getImageData();
        mask = app.editor.mask;
        if (!saved) {
          return dfd.reject().promise();
        }
        canvas = document.createElement('canvas');
        canvas.width = this.editor.width;
        canvas.height = this.editor.height;
        context = canvas.getContext('2d');
        encoder = new GIFEncoder;
        encoder.setRepeat(0);
        encoder.setDelay(this.speed);
        encoder.setSize(this.editor.width, this.editor.height);
        encoder.setQuality(1);
        progress = function(context, count) {
          var height, imageData, width, _ref;

          _ref = context.canvas, width = _ref.width, height = _ref.height;
          imageData = context.getImageData(0, 0, width, height);
          return function() {
            _this.editor.write(imageData);
            return dfd.notify(count);
          };
        };
        encoder.start();
        for (i = _i = 0, _ref = this.frames; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          context.putImageData(saved, 0, 0);
          processed = this._process(context, mask);
          encoder.addFrame(processed).then(progress(processed, i));
        }
        encoder.finish();
        encoder.stream().getData().then(function(data) {
          return dfd.resolve(data);
        });
        return dfd.promise();
      };

      Application.prototype._process = function(context, mask) {
        var i, imageData, sh, sw, sx, sy, _i, _ref;

        for (i = _i = 0, _ref = mask.data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (mask.data[i]) {
            sx = ((i % mask.xmax) | 0) * mask.size;
            sy = ((i / mask.xmax) | 0) * mask.size;
            sw = mask.size;
            sh = mask.size;
            imageData = context.getImageData(sx, sy, sw, sh);
            context.fillStyle = mosaic(imageData, sw, sh);
            context.fillRect(sx, sy, sw, sh);
          }
        }
        return context;
      };

      mosaic = function(imageData, w, h) {
        var colors, x, y, _i, _j;

        colors = [];
        for (y = _i = 0; 0 <= h ? _i < h : _i > h; y = 0 <= h ? ++_i : --_i) {
          for (x = _j = 0; 0 <= w ? _j < w : _j > w; x = 0 <= w ? ++_j : --_j) {
            colors.push([imageData.data[(y + x) * 4 + 0], imageData.data[(y + x) * 4 + 1], imageData.data[(y + x) * 4 + 2]]);
          }
        }
        return "rgb(" + (colors.choose().join(',')) + ")";
      };

      return Application;

    })();
    src = document.getElementById('editor');
    dst = document.getElementById('result');
    src.width = src.height = dst.width = dst.height = SIZE;
    app = new Application(src, dst);
    $(window).on('dragover', function(e) {
      e.preventDefault();
      return e.stopPropagation();
    });
    $(window).on('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (app.setImage(e.originalEvent.dataTransfer.files[0])) {
        return app.setMode('trim');
      }
    });
    $btn.on('click', function() {
      return typeof this.cmd === "function" ? this.cmd() : void 0;
    });
    $($btn[0]).on('click', function() {
      if (app.prev_mode !== null) {
        return app.setMode(app.prev_mode);
      }
    });
    $($btn[3]).on('click', function() {
      if (app.next !== null) {
        return app.setMode(app.next_mode);
      }
    });
    $('#dialog .lsf-icon').on('click', function() {
      var $elem, key, val;

      $elem = $(this);
      key = $elem.attr('data-key');
      val = $elem.attr('title') === 'plus' ? +1 : -1;
      app.setConfig(key, val);
      return $("#" + key).text(app.getConfig(key));
    });
    drag_mode = function() {
      $('#result').hide();
      $('#dialog').hide();
      $('#editor').show();
      $msg.text('1. Drag a image');
      $btn.set([
        {
          icon: 'back',
          enabled: false
        }, {
          icon: 'zoomout',
          enabled: false
        }, {
          icon: 'zoomin',
          enabled: false
        }, {
          icon: 'next',
          enabled: !!app.getImage()
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = null;
      return app.next_mode = 'trim';
    };
    trim_mode = function() {
      $('#result').hide();
      $('#dialog').hide();
      $('#editor').show();
      app.editor.draw();
      $msg.text('2. Triming');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'zoomout',
          enabled: true,
          cmd: function() {
            return app.setZoom(app.getZoom() / 1.2);
          }
        }, {
          icon: 'zoomin',
          enabled: true,
          cmd: function() {
            return app.setZoom(app.getZoom() * 1.2);
          }
        }, {
          icon: 'next',
          enabled: true
        }
      ]);
      $(app.editor.elem).css('cursor', 'move');
      app.prev_mode = 'drag';
      return app.next_mode = 'mask';
    };
    mask_mode = function() {
      $('#result').hide();
      $('#dialog').hide();
      $('#editor').show();
      app.editor.draw();
      $msg.text('3. Masking');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'write',
          enabled: true,
          cmd: function() {
            app.setMaskValue(1);
            $($btn[1]).css('color', NAVY);
            return $($btn[2]).css('color', BLACK);
          }
        }, {
          icon: 'eraser',
          enabled: true,
          cmd: function() {
            app.setMaskValue(0);
            $($btn[1]).css('color', BLACK);
            return $($btn[2]).css('color', NAVY);
          }
        }, {
          icon: 'next',
          enabled: true
        }
      ]);
      $($btn[1]).click();
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'trim';
      return app.next_mode = 'conf';
    };
    conf_mode = function() {
      $('#result').hide();
      $('#editor').hide();
      $('#dialog').show();
      $msg.text('4. Configuration');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'write',
          enabled: false
        }, {
          icon: 'eraser',
          enabled: false
        }, {
          icon: 'next',
          enabled: true
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'mask';
      return app.next_mode = 'exec';
    };
    exec_mode = function() {
      var P0, P1, countmax;

      P0 = '-';
      P1 = '>';
      countmax = app.frames;
      $('#result').hide();
      $('#dialog').hide();
      $('#editor').show();
      $msg.text('5. Processing: ' + P0.times(countmax));
      $btn.set([
        {
          icon: 'back',
          enabled: false
        }, {
          icon: 'write',
          enabled: false
        }, {
          icon: 'eraser',
          enabled: false
        }, {
          icon: 'next',
          enabled: false
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = null;
      app.next_mode = null;
      return app.generate().then(function(data) {
        src = "data:image/gif;base64," + (btoa(data));
        $('#editor').hide();
        $('#dialog').hide();
        $('#result').attr({
          src: src
        }).show();
        return app.setMode('save');
      }).progress(function(count) {
        var msg;

        msg = '4. Processing: ';
        msg += P1.times(count + 1);
        msg += P0.times(countmax - count - 1);
        return $msg.text(msg);
      });
    };
    save_mode = function() {
      $msg.text('6. Right-Click and use "Save As"');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'write',
          enabled: false
        }, {
          icon: 'eraser',
          enabled: false
        }, {
          icon: 'next',
          enabled: false
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'conf';
      return app.next_mode = 'drag';
    };
    return app.setMode('drag');
  });

}).call(this);
