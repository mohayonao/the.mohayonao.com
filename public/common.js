(function() {
  $(function() {
    'use strict';
    var apps, ua, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    if (window.requestAnimationFrame == null) {
      window.requestAnimationFrame = (_ref = (_ref1 = (_ref2 = (_ref3 = window.webkitRequestAnimationFrame) != null ? _ref3 : window.mozRequestAnimationFrame) != null ? _ref2 : window.oRequestAnimationFrame) != null ? _ref1 : window.msRequestAnimationFrame) != null ? _ref : function(f) {
        return setTimeout(f, 1000 / 60);
      };
    }
    if (window.cancelAnimationFrame == null) {
      window.cancelAnimationFrame = (_ref4 = (_ref5 = (_ref6 = (_ref7 = window.webkitCancelAnimationFrame) != null ? _ref7 : window.mozCancelAnimationFrame) != null ? _ref6 : window.oCancelAnimationFrame) != null ? _ref5 : window.msCancelRequestAnimationFrame) != null ? _ref4 : function(id) {
        return clearTimeout(id);
      };
    }
    if (window.AudioContext == null) {
      window.AudioContext = window.webkitAudioContext;
    }
    window.createObjectURL = (_ref8 = window.URL || window.webkitURL) != null ? _ref8.createObjectURL : void 0;
    ua = navigator.userAgent;
    apps = window.apps = {};
    apps.name = (_ref9 = /^(\/[-\w]+\/)/.exec(location.pathname)) != null ? _ref9[1] : void 0;
    apps.isPhone = /(iPhone|iPod|Android)/i.test(navigator.userAgent);
    apps.isTablet = /(iPad|Android)/i.test(navigator.userAgent);
    apps.isDesktop = !(apps.isPhone || apps.isTablet);
    apps.isMobile = !apps.isDesktop;
    apps.isMouseDevice = apps.isDesktop;
    apps.isTouchDevice = !apps.isDesktop;
    apps.lang = /ja/.test(navigator.language) ? 'ja' : 'en';
    apps.tweet = function(opts) {
      var h, l, t, url, w;
      w = 550;
      h = 420;
      l = Math.round((screen.width - w) * 0.5);
      t = Math.round((screen.height - h) * 0.5);
      url = "https://twitter.com/intent/tweet?" + ($.param(opts));
      return window.open(url, 'intent', "width=" + w + ",height=" + h + ",left=" + l + ",top=" + t);
    };
    apps.param = $.param;
    apps.deparam = function(str) {
      var obj;
      obj = {};
      str.split('$').forEach(function(x) {
        var items, key;
        items = x.split('=');
        key = decodeURIComponent(items[0]);
        if (items.length === 1) {
          return obj[key] = true;
        } else {
          return obj[key] = decodeURIComponent(items[1]);
        }
      });
      return obj;
    };
    return apps.animate = function(opts) {
      var func, ifps, prev, _animate, _ref10;
      func = arguments[arguments.length - 1];
      ifps = 1000 / ((_ref10 = opts.fps) != null ? _ref10 : 60);
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
  });

}).call(this);
