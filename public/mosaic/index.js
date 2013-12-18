(function() {
  $(function() {
    'use strict';
    var $btn, $msg, Application, BLACK, Editor, GRAY, MosaicProcessor, NAVY, SIZE, app, conf_mode, drag_mode, dst, exec_mode, image, mask_mode, save_mode, src, trim_mode;
    SIZE = 400;
    BLACK = '#302833';
    NAVY = '#223a70';
    GRAY = '#c0c6c9';
    Array.prototype.choose = function() {
      return this[(Math.random() * this.length) | 0];
    };
    Array.prototype.shuffle = function() {
      var a;
      a = this.slice(0);
      a.sort(function(x) {
        return Math.random() - 0.5;
      });
      return a;
    };
    String.prototype.times = function(n) {
      var i;
      return ((function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i < n; i = _i += 1) {
          _results.push(this);
        }
        return _results;
      }).call(this)).join('');
    };
    Editor = (function() {
      var drawmask, setEventListener;

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
        var i, imageData, sh, sw, sx, sy, _i, _ref;
        if (this.image) {
          imageData = this.getImageData();
          this.context.putImageData(imageData, 0, 0);
          for (i = _i = 0, _ref = this.mask.data.length; _i < _ref; i = _i += 1) {
            if (this.mask.data[i]) {
              sx = ((i % this.mask.xmax) | 0) * this.mask.size;
              sy = ((i / this.mask.xmax) | 0) * this.mask.size;
              sw = this.mask.size;
              sh = this.mask.size;
              drawmask(imageData, sx, sy, sw, sh);
            }
          }
          this.context.putImageData(imageData, 0, 0);
          return imageData;
        }
      };

      drawmask = function(imageData, sx, sy, sw, sh) {
        var data, i, _i, _results, _x, _y;
        data = imageData.data;
        _results = [];
        for (_y = _i = 0; _i < sh; _y = _i += 1) {
          _results.push((function() {
            var _j, _results1;
            _results1 = [];
            for (_x = _j = 0; _j < sw; _x = _j += 1) {
              i = ((sy + _y) * imageData.width + (sx + _x)) * 4;
              data[i + 0] = 255 - data[i + 0];
              data[i + 1] = 255 - data[i + 1];
              _results1.push(data[i + 2] = 255 - data[i + 2]);
            }
            return _results1;
          })());
        }
        return _results;
      };

      Editor.prototype.write = function(imageData) {
        return this.context.putImageData(imageData, 0, 0);
      };

      setEventListener = function(elem) {
        var $elem,
          _this = this;
        $elem = $(elem);
        $elem.on('mousedown', function(e) {
          var offset, x, y, _ref, _ref1;
          offset = $elem.offset();
          x = (_ref = e.offsetX) != null ? _ref : e.pageX - offset.left;
          y = (_ref1 = e.offsetY) != null ? _ref1 : e.pageY - offset.top;
          switch (_this.mode) {
            case 'mask':
              _this.paint(x, y);
          }
          _this.mousedown = {
            x: x,
            y: y
          };
          e.preventDefault();
          e.stopPropagation();
          return e.returnValue = false;
        });
        $elem.on('mousemove', function(e) {
          var dx, dy, offset, x, y, _ref, _ref1;
          offset = $elem.offset();
          x = (_ref = e.offsetX) != null ? _ref : e.pageX - offset.left;
          y = (_ref1 = e.offsetY) != null ? _ref1 : e.pageY - offset.top;
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
              x: x,
              y: y
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
      var FRAMES, SPEED;

      FRAMES = [2, 3, 4, 6, 8, 10, 12];

      SPEED = [10, 25, 50, 100, 200, 250, 500, 1000];

      function Application(src, dst) {
        this.editor = new Editor(src);
        this.result = dst;
        this.prev_mode = null;
        this.next_mode = null;
        this.frames = 6;
        this.speed = 100;
      }

      Application.prototype.setImage = function(file) {
        var reader,
          _this = this;
        if (this.editor.getMode() !== 'drag') {
          return false;
        }
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
        if (file instanceof Image) {
          this.editor.setImage(file);
        }
        return true;
      };

      Application.prototype.getImage = function() {
        return this.editor.getImage();
      };

      Application.prototype.setMode = function(mode, arg) {
        this.editor.setMode(mode);
        switch (mode) {
          case 'drag':
            return drag_mode(arg);
          case 'trim':
            return trim_mode(arg);
          case 'mask':
            return mask_mode(arg);
          case 'conf':
            return conf_mode(arg);
          case 'exec':
            return exec_mode(arg);
          case 'save':
            return save_mode(arg);
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
        var canvas, context, dfd, encoder, i, mask, processed, processor, progress, saved, _i, _ref,
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
        processor = new MosaicProcessor(saved, mask);
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
        for (i = _i = 0, _ref = this.frames; _i < _ref; i = _i += 1) {
          context.putImageData(saved, 0, 0);
          processed = processor.process(context);
          encoder.addFrame(processed).then(progress(processed, i));
        }
        encoder.finish();
        encoder.stream().getData().then(function(data) {
          return dfd.resolve(data);
        });
        return dfd.promise();
      };

      return Application;

    })();
    MosaicProcessor = (function() {
      var build, fetchcolor;

      function MosaicProcessor(image, mask) {
        this.image = image;
        this.mask = mask;
        this.colormap = build(this.image, this.mask);
      }

      build = function(imageData, mask) {
        var i, list, sh, sw, sx, sy, _i, _ref;
        list = [];
        for (i = _i = 0, _ref = mask.data.length; _i < _ref; i = _i += 1) {
          if (mask.data[i]) {
            sx = ((i % mask.xmax) | 0) * mask.size;
            sy = ((i / mask.xmax) | 0) * mask.size;
            sw = mask.size;
            sh = mask.size;
            list[i] = fetchcolor(imageData, sx, sy, sw, sh).shuffle();
          }
        }
        return list;
      };

      fetchcolor = function(imageData, sx, sy, sw, sh) {
        var b, colors, data, g, i, r, _i, _j, _x, _y;
        colors = {};
        data = imageData.data;
        for (_y = _i = 0; _i < sh; _y = _i += 1) {
          for (_x = _j = 0; _j < sw; _x = _j += 1) {
            i = ((sy + _y) * imageData.width + (sx + _x)) * 4;
            r = data[i + 0];
            g = data[i + 1];
            b = data[i + 2];
            colors["" + r + "," + g + "," + b] = true;
          }
        }
        return Object.keys(colors).map(function(x) {
          return "rgb(" + x + ")";
        });
      };

      MosaicProcessor.prototype.process = function(context) {
        var i, imageData, mask, sh, sw, sx, sy, _i, _ref;
        mask = this.mask;
        for (i = _i = 0, _ref = mask.data.length; _i < _ref; i = _i += 1) {
          if (mask.data[i]) {
            sx = ((i % mask.xmax) | 0) * mask.size;
            sy = ((i / mask.xmax) | 0) * mask.size;
            sw = mask.size;
            sh = mask.size;
            imageData = context.getImageData(sx, sy, sw, sh);
            context.fillStyle = this.mosaic(i);
            context.fillRect(sx, sy, sw, sh);
          }
        }
        return context;
      };

      MosaicProcessor.prototype.mosaic = function(index) {
        var color;
        color = this.colormap[index].shift();
        this.colormap[index].push(color);
        return color;
      };

      return MosaicProcessor;

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
    $btn.on('mousedown', function(e) {
      return e.returnValue = false;
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
    $('#dialog .lsf-icon').on('mousedown', function(e) {
      return e.returnValue = false;
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
      $('#download').hide();
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
      return setTimeout(function() {
        return app.generate().then(function(data) {
          src = "data:image/gif;base64," + (btoa(data));
          return app.setMode('save', src);
        }).progress(function(count) {
          var msg;
          msg = '4. Processing: ';
          msg += P1.times(count + 1);
          msg += P0.times(countmax - count - 1);
          return $msg.text(msg);
        });
      }, 0);
    };
    save_mode = function(src) {
      $('#editor').hide();
      $('#dialog').hide();
      $('#result').attr({
        src: src
      }).show();
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
      if (/chrome/i.test(navigator.userAgent)) {
        $('#download').attr({
          href: src
        });
        $('#download').show();
      }
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'conf';
      return app.next_mode = null;
    };
    app.setMode('drag');
    image = new Image;
    image.onload = function() {
      app.setImage(image);
      return app.setMode('drag');
    };
    return image.src = '/canvas/sample01.jpg';
  });

}).call(this);
