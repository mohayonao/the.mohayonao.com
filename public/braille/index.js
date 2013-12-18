(function() {
  $(function() {
    'use strict';
    var $btn, $msg, Application, BLACK, Editor, GRAY, NAVY, SIZE, app, drag_mode, dst, image, save_mode, src, thre_mode, trim_mode;
    SIZE = 400;
    BLACK = '#302833';
    NAVY = '#223a70';
    GRAY = '#c0c6c9';
    Editor = (function() {
      var binalize, setEventListener;

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
        this.threshold = 128;
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

      Editor.prototype.setThreshold = function(threshold) {
        this.threshold = threshold;
        return this.draw();
      };

      Editor.prototype.getThreshold = function() {
        return this.threshold;
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

      Editor.prototype.getImageData = function() {
        var imageData, sh, sw, sx, sy, x1, x2, y1, y2, z, _ref;
        if (this.image) {
          z = 1 / this.zoom;
          x1 = (this.image.halfWidth - this.halfWidth * z) + this.position.x;
          y1 = (this.image.halfHeight - this.halfHeight * z) + this.position.y;
          x2 = x1 + this.width * z;
          y2 = y1 + this.height * z;
          _ref = [x1, y1, x2 - x1, y2 - y1], sx = _ref[0], sy = _ref[1], sw = _ref[2], sh = _ref[3];
          this.context.drawImage(this.image, sx, sy, sw, sh, 0, 0, this.width, this.height);
          imageData = this.context.getImageData(0, 0, this.width, this.height);
          if (this.mode === 'thre') {
            binalize(imageData, this.threshold);
          }
          return imageData;
        }
      };

      Editor.prototype.draw = function() {
        var imageData;
        if (this.image) {
          imageData = this.getImageData();
          this.context.putImageData(imageData, 0, 0);
          return imageData;
        }
      };

      binalize = function(imageData, threshold) {
        var data, gray, i, _i, _ref;
        data = imageData.data;
        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
          gray = 0.114 * data[i] + 0.587 * data[i + 1] + 0.299 * data[i + 2];
          data[i + 0] = data[i + 1] = data[i + 2] = gray < threshold ? 0 : 255;
        }
        return 0;
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
        $btn[i].cmd = items.cmd;
        return $btn[i].keep = items.keep;
      });
    };
    Application = (function() {
      var barilleChars;

      function Application(src, dst) {
        this.editor = new Editor(src);
        this.result = dst;
        this.prev_mode = null;
        this.next_mode = null;
        this.timer = 0;
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
          case 'thre':
            return thre_mode(arg);
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

      Application.prototype.setThreshold = function(value) {
        return this.editor.setThreshold(value);
      };

      Application.prototype.getThreshold = function() {
        return this.editor.getThreshold();
      };

      Application.prototype.setTimer = function(func) {
        if (this.timer) {
          this.clearTimer();
        }
        return this.timer = setInterval(func, 50);
      };

      Application.prototype.clearTimer = function() {
        if (this.timer) {
          clearInterval(this.timer);
        }
        return this.timer = 0;
      };

      barilleChars = (function() {
        var dot, i, _i, _results;
        dot = function(bits) {
          return bits & 7 | (bits & 112) >> 1 | (bits & 8) << 3 | bits & 128;
        };
        _results = [];
        for (i = _i = 0; _i <= 255; i = ++_i) {
          _results.push(String.fromCharCode(0x2800 + dot(i)));
        }
        return _results;
      })();

      Application.prototype.generate = function(callback) {
        var canvas, context, data, i, index, l, list, num, widthStep, x, y, _i, _j, _k;
        canvas = document.createElement('canvas');
        canvas.width = 112;
        canvas.height = 112;
        context = canvas.getContext('2d');
        context.drawImage(this.editor.elem, 0, 0, this.editor.width, this.editor.height, 0, 0, canvas.width, canvas.height);
        data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        widthStep = canvas.width * 4;
        list = [];
        for (y = _i = 0; _i < 28; y = ++_i) {
          l = [];
          for (x = _j = 0; _j < 56; x = ++_j) {
            index = ((y * 4 * canvas.width) + x * 2) * 4;
            num = 0;
            for (i = _k = 0; _k < 8; i = ++_k) {
              if (192 > data[index + (i % 4) * widthStep + (i / 4) | 0]) {
                num += Math.pow(2, i);
              }
            }
            l.push(barilleChars[num]);
          }
          list.push(l.join(''));
          0;
        }
        return callback(list.join('\n'));
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
    $btn.on('mousedown', function(e) {
      var _this = this;
      if (this.keep) {
        app.setTimer(function() {
          return typeof _this.cmd === "function" ? _this.cmd() : void 0;
        });
      }
      return e.returnValue = false;
    });
    $btn.on('mouseup', function(e) {
      app.clearTimer();
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
    drag_mode = function() {
      $('#result').hide();
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
      return app.next_mode = 'thre';
    };
    thre_mode = function() {
      $('#result').hide();
      $('#editor').show();
      app.editor.draw();
      $msg.text('3. Threshold');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'up',
          enabled: true,
          keep: true,
          cmd: function() {
            return app.setThreshold(Math.min(255, app.getThreshold() + 2));
          }
        }, {
          icon: 'down',
          enabled: true,
          keep: true,
          cmd: function() {
            return app.setThreshold(Math.max(0, app.getThreshold() - 2));
          }
        }, {
          icon: 'next',
          enabled: true
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'trim';
      return app.next_mode = 'save';
    };
    save_mode = function(src) {
      $('#editor').hide();
      $('#result').attr({
        src: src
      }).show();
      $msg.text('6. Copy and Paste');
      $btn.set([
        {
          icon: 'back',
          enabled: true
        }, {
          icon: 'up',
          enabled: false
        }, {
          icon: 'down',
          enabled: false
        }, {
          icon: 'next',
          enabled: false
        }
      ]);
      $(app.editor.elem).css('cursor', 'default');
      app.prev_mode = 'thre';
      app.next_mode = null;
      return setTimeout(function() {
        return app.generate(function(text) {
          return $('#result').text(text);
        });
      }, 0);
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
