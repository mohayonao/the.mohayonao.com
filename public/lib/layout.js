(function() {
  $(function() {
    'use strict';
    var $sidebar, app_name, apps, show_app_image, ua, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

    if ((_ref = window.requestAnimationFrame) == null) {
      window.requestAnimationFrame = (_ref1 = (_ref2 = (_ref3 = (_ref4 = window.webkitRequestAnimationFrame) != null ? _ref4 : window.mozRequestAnimationFrame) != null ? _ref3 : window.oRequestAnimationFrame) != null ? _ref2 : window.msRequestAnimationFrame) != null ? _ref1 : function(f) {
        return setTimeout(f, 1000 / 60);
      };
    }
    ua = navigator.userAgent;
    apps = window.apps = {};
    apps.isPhone = /(iPhone|iPod|Android)/i.test(navigator.userAgent);
    apps.isTablet = /(iPad|Android)/i.test(navigator.userAgent);
    apps.isDesktop = !(apps.isPhone || apps.isTablet);
    apps.isMouseDevice = apps.isDesktop;
    apps.isTouchDevice = !apps.isDesktop;
    if (apps.isMouseDevice) {
      app_name = (_ref5 = /^(\/[-\w]+\/)/.exec(location.pathname)) != null ? _ref5[1] : void 0;
      $sidebar = $('#sidebar');
      show_app_image = (function() {
        var $img;

        $img = $('img', $sidebar);
        return function(name) {
          var _ref6;

          return $img.attr('src', (_ref6 = show_app_image[name]) != null ? _ref6 : 'appimage.png');
        };
      })();
      $('li', $sidebar).each(function(i, elem) {
        var $li, id, imgurl, src, title;

        $li = $(elem);
        id = $li.attr('id');
        title = $li.attr('data-title');
        src = /^https?:/.test(id) ? (imgurl = title.replace(/\s/g, '_'), "/lib/icon/" + imgurl + ".png") : "" + id + "appimage.png";
        $('<img>').attr('src', src).on('load', function() {
          return show_app_image[id] = src;
        });
        if (app_name === id) {
          $li.css('list-style-image', 'url("/lib/list-style.gif")');
        }
        return $li.on('mouseover', function() {
          return show_app_image(id);
        });
      });
      $('ul', $sidebar).on('mouseout', function() {
        return show_app_image(null);
      });
      $('h1', $sidebar).on('mouseout', function() {
        return show_app_image(null);
      });
      return $('h1', $sidebar).on('mouseover', function() {
        return show_app_image(null);
      });
    } else if (apps.isPhone) {
      $('#sidebar').hide();
      return $('#content').css({
        'margin-left': '0'
      });
    }
  });

}).call(this);
