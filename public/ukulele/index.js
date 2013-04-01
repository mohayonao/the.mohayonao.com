(function() {
  $(function() {
    'use strict';
    var $result, Application, app, q;

    Application = (function() {
      function Application() {
        var _this = this;

        this.data = null;
        this.imageData = null;
        this.sequencer = new lelenofu.Sequencer();
        this.sequencer.eof = function() {
          return _this.pause();
        };
        this.isPlaying = false;
        this.timerId = 0;
        this.prev = null;
      }

      Application.prototype.update = function(data) {
        var dfd,
          _this = this;

        dfd = $.Deferred();
        data = data.trim();
        if (this.prev) {
          this.prev.reject();
        }
        if (data !== this.data) {
          if (this.timerId) {
            clearTimeout(this.timerId);
          }
          this.timerId = setTimeout(function() {
            _this.data = data;
            _this.imageData = lelenofu.getImageData(data);
            return dfd.resolve(_this.imageData);
          }, 200);
        } else {
          dfd.reject();
        }
        this.prev = dfd;
        return dfd.promise();
      };

      Application.prototype.play = function() {
        this.isPlaying = true;
        this.sequencer.play(lelenofu.parse(this.data));
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
          return $('#play').css('color', 'red');
        case 'pause':
          return $('#play').css('color', 'black');
      }
    };
    $result = $('#result');
    $('#data').on('keyup', function() {
      return app.update($(this).val().trim()).then(function(data) {
        $result.css({
          width: "" + data.width + "px",
          height: "" + data.height + "px"
        });
        return $result.attr('src', lelenofu.getImageSrc(data));
      });
    });
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
        url = "http://" + location.host + "/ukulele/";
        url = "http://the.mohayonao.com/ukulele/";
        url += "?" + data;
        return apps.tweet({
          url: url
        });
      }
    });
    if ((q = location.search.substr(1, location.search.length - 1))) {
      $('#data').val(decodeURIComponent(q));
    }
    return $('#data').keyup();
  });

}).call(this);
