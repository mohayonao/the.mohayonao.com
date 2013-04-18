(function() {
  $(function() {
    'use strict';
    var $sidebar, apps, ua, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

    if ((_ref = window.requestAnimationFrame) == null) {
      window.requestAnimationFrame = (_ref1 = (_ref2 = (_ref3 = (_ref4 = window.webkitRequestAnimationFrame) != null ? _ref4 : window.mozRequestAnimationFrame) != null ? _ref3 : window.oRequestAnimationFrame) != null ? _ref2 : window.msRequestAnimationFrame) != null ? _ref1 : function(f) {
        return setTimeout(f, 1000 / 60);
      };
    }
    ua = navigator.userAgent;
    apps = window.apps = {};
    apps.name = (_ref5 = /^(\/[-\w]+\/)/.exec(location.pathname)) != null ? _ref5[1] : void 0;
    apps.isPhone = /(iPhone|iPod|Android)/i.test(navigator.userAgent);
    apps.isTablet = /(iPad|Android)/i.test(navigator.userAgent);
    apps.isDesktop = !(apps.isPhone || apps.isTablet);
    apps.isMouseDevice = apps.isDesktop;
    apps.isTouchDevice = !apps.isDesktop;
    apps.tweet = function(opts) {
      var features, h, l, t, url, w;

      w = 550;
      h = 250;
      l = Math.round((screen.width - w) * 0.5);
      t = Math.round((screen.height - h) * 0.5);
      url = "https://twitter.com/share?" + ($.param(opts));
      features = "width=" + w + ",height=" + h + ",left=" + l + ",top=" + t;
      return window.open(url, 'intent', features);
    };
    apps.param = $.param;
    apps.deparam = function(str) {
      var items, key, obj, x, _i, _len, _ref6;

      obj = {};
      _ref6 = str.split('&');
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        x = _ref6[_i];
        items = x.split('=');
        key = decodeURIComponent(items[0]);
        if (items.length === 1) {
          obj[key] = true;
        } else {
          obj[key] = decodeURIComponent(items[1]);
        }
      }
      return obj;
    };
    apps.animate = function(opts) {
      var func, ifps, prev, _animate, _ref6;

      func = arguments[arguments.length - 1];
      ifps = 1000 / ((_ref6 = opts.fps) != null ? _ref6 : 60);
      prev = 0;
      _animate = function(now) {
        var dt, result;

        dt = now - prev;
        if (dt > ifps) {
          result = func(now, dt);
          prev = now;
        }
        if (result !== false) {
          return requestAnimationFrame(_animate);
        }
      };
      return requestAnimationFrame(_animate);
    };
    $sidebar = $('#sidebar');
    if (apps.isMouseDevice) {
      return $('li', $sidebar).each(function(i, elem) {
        var $li, media;

        $li = $(elem);
        media = $li.attr('data-media');
        if (media === 'tablet' || media === 'phone') {
          return $li.remove();
        }
      });
    } else if (apps.isTablet) {
      return $('li', $sidebar).each(function(i, elem) {
        var $li, media;

        $li = $(elem);
        media = $li.attr('data-media');
        if (media === 'desktop' || media === 'phone') {
          return $li.remove();
        }
      });
    } else if (apps.isPhone) {
      $('#sidebar').hide();
      $('#content').css({
        'margin-left': '0'
      });
      $('#appimage').empty();
      return $('li', $sidebar).each(function(i, elem) {
        var $li, media;

        $li = $(elem);
        media = $li.attr('data-media');
        if (media === 'desktop' || media === 'tablet') {
          return $li.remove();
        }
      });
    }
  });

}).call(this);
