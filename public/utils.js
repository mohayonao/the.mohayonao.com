(function() {
  $(function() {
    'use strict';
    var utils, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
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
    utils = window.utils = {};
    utils.getName = function() {
      var _ref9;
      return (_ref9 = /^(\/[-\w]+\/)/.exec(location.pathname)) != null ? _ref9[1] : void 0;
    };
    utils.lang = function(data) {
      if (data.hasOwnProperty(navigator.language)) {
        data = data[navigator.language];
      } else {
        data = data[''];
      }
      if (typeof data === 'function') {
        data = data();
      }
      if (!(typeof data === 'string')) {
        data = '';
      }
      return data;
    };
    utils.isPhone = function() {
      return /(iPhone|iPod|Android)/i.test(navigator.userAgent);
    };
    utils.isTablet = function() {
      return /(iPad|Android)/i.test(navigator.userAgent);
    };
    utils.isDesktop = function() {
      return !(utils.isPhone() || utils.isTablet());
    };
    utils.isMobile = function() {
      return !utils.isDesktop();
    };
    utils.isMouseDevice = function() {
      return utils.isDesktop();
    };
    utils.isTouchDevice = function() {
      return !utils.isDesktop();
    };
    utils.tweet = function(opts) {
      var h, l, t, url, w;
      w = 550;
      h = 420;
      l = Math.round((screen.width - w) * 0.5);
      t = Math.round((screen.height - h) * 0.5);
      url = "https://twitter.com/intent/tweet?" + ($.param(opts));
      return window.open(url, 'intent', "width=" + w + ",height=" + h + ",left=" + l + ",top=" + t);
    };
    utils.param = $.param;
    utils.deparam = function(str) {
      var obj;
      obj = {};
      str.split('&').forEach(function(x) {
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
    return utils.animate = function(opts) {
      var animate, func, ifps, prev, _ref9;
      func = arguments[arguments.length - 1];
      ifps = 1000 / ((_ref9 = opts.fps) != null ? _ref9 : 60);
      prev = 0;
      animate = function(now) {
        var dt, result;
        dt = now - prev;
        if (dt > ifps) {
          result = func(now, dt);
          prev = now;
        }
        if (result !== false) {
          return requestAnimationFrame(animate);
        }
      };
      return requestAnimationFrame(animate);
    };
  });

}).call(this);
