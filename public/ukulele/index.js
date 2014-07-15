(function() {
  $(function() {
    'use strict';
    var $result, Application, app, editor, q, value;
    Application = (function() {
      function Application() {
        this.data = null;
        this.imageData = null;
        this.sequencer = new ukulele.Sequencer();
        this.sequencer.emit = (function(_this) {
          return function() {
            return _this.pause();
          };
        })(this);
        this.isPlaying = false;
        this.timerId = 0;
        this.prev = null;
      }

      Application.prototype.update = function(data) {
        var dfd;
        dfd = $.Deferred();
        data = data.trim();
        if (this.prev) {
          this.prev.reject();
        }
        if (data !== this.data) {
          if (this.timerId) {
            clearTimeout(this.timerId);
          }
          this.timerId = setTimeout((function(_this) {
            return function() {
              _this.data = data;
              _this.imageData = ukulele.getImageData(data);
              return dfd.resolve(_this.imageData);
            };
          })(this), 200);
        } else {
          dfd.reject();
        }
        this.prev = dfd;
        return dfd.promise();
      };

      Application.prototype.play = function() {
        this.isPlaying = true;
        this.sequencer.play(this.data);
        return typeof this.onStateChange === "function" ? this.onStateChange('play') : void 0;
      };

      Application.prototype.pause = function() {
        this.isPlaying = false;
        this.sequencer.pause();
        return typeof this.onStateChange === "function" ? this.onStateChange('pause') : void 0;
      };

      return Application;

    })();
    app = new Application;
    app.onStateChange = function(type) {
      switch (type) {
        case 'play':
          return $('#play').addClass('btn-active');
        case 'pause':
          return $('#play').removeClass('btn-active');
      }
    };
    $result = $('#result');
    editor = CodeMirror.fromTextArea(document.getElementById('data'), {
      mode: 'ukulele',
      theme: 'ukulele',
      workTime: 200
    });
    value = (q = location.hash.substr(1, location.hash.length - 1)) ? decodeURIComponent(q) : '';
    editor.setValue(value);
    editor.update = function() {
      return app.update(editor.getValue().trim()).then(function(data) {
        $result.css({
          width: "" + data.width + "px",
          height: "" + data.height + "px"
        });
        return $result.attr('src', ukulele.getImageSrc(data));
      });
    };
    editor.on('update', editor.update);
    $('#play').on('click', function() {
      if (app.isPlaying) {
        return app.pause();
      } else {
        return app.play();
      }
    });
    $('#tweet').on('click', function() {
      var data, url;
      if (app.data) {
        data = encodeURIComponent(app.data);
        url = "http://" + location.host + "/ukulele/#" + data;
        return apps.tweet({
          url: url
        });
      }
    });
    (function() {
      var $demo;
      $demo = $('#demo');
      demo.forEach(function(value, i) {
        var $option;
        return $option = $('<option>').text("demo 0" + (i + 1)).appendTo($demo);
      });
      $demo.on('change', function() {
        editor.setValue(demo[this.selectedIndex]);
        return editor.update();
      });
      if (value === '') {
        return $demo.change();
      }
    })();
    return editor.update();
  });

}).call(this);
