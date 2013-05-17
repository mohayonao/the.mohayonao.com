(function() {
  $(function() {
    'use strict';
    var blink, cache, changeFavicon, current, editor, getCssRule, gotoHash;

    sc.use('prototype');
    editor = ace.edit('editor');
    editor.setTheme('ace/theme/monokai');
    editor.setPrintMarginColumn(-1);
    editor.getSession().setTabSize(2);
    editor.getSession().setMode('ace/mode/coffee');
    editor.setSelectionStyle('text');
    editor.focus();
    cache = {};
    getCssRule = function(selector) {
      var rule, rules, sheet, sheets, _i, _j, _len, _len1, _ref;

      if (cache[selector]) {
        return cache[selector];
      }
      sheets = [].slice.call(document.styleSheets).reverse();
      for (_i = 0, _len = sheets.length; _i < _len; _i++) {
        sheet = sheets[_i];
        rules = [].slice.call((_ref = sheet.cssRules) != null ? _ref : sheet.rules).reverse();
        for (_j = 0, _len1 = rules.length; _j < _len1; _j++) {
          rule = rules[_j];
          if (rule.selectorText.indexOf(selector) !== -1) {
            cache[selector] = rule;
            return rule;
          }
        }
      }
      return null;
    };
    blink = function(selector) {
      var rule, savedBackground;

      rule = getCssRule(selector);
      if (!rule) {
        return;
      }
      if (!rule.savedBackground) {
        rule.savedBackground = rule.style.getPropertyValue('background');
      }
      savedBackground = rule.savedBackground;
      rule.style.setProperty('background', '#e60033');
      return setTimeout(function() {
        return rule.style.setProperty('background', savedBackground);
      }, 250);
    };
    editor.commands.addCommand({
      name: 'play',
      bindKey: 'Ctrl-Enter',
      exec: function(editor) {
        var code, err, sess;

        sess = editor.session;
        code = sess.getTextRange(editor.getSelectionRange());
        if (code === '') {
          code = sess.getLine(editor.getCursorPosition().row);
          blink('.ace_marker-layer .ace_active-line');
        } else {
          blink('.ace_marker-layer .ace_selection');
        }
        try {
          return eval.call(window, CoffeeScript.compile(code, {
            bare: true
          }));
        } catch (_error) {
          err = _error;
          return console.warn(err);
        }
      }
    });
    editor.commands.addCommand({
      name: 'stop',
      bindKey: 'Ctrl-.',
      exec: function(editor) {
        timbre.reset();
        return timbre.pause();
      }
    });
    editor.getSession().selection.on('changeCursor', function(e) {
      return localStorage.setItem("" + current + ".cursor", JSON.stringify({
        pos: editor.getCursorPosition(),
        row: editor.getFirstVisibleRow()
      }));
    });
    changeFavicon = function(mode) {
      return $('#favicon').attr({
        href: "" + mode + ".gif"
      });
    };
    changeFavicon('pause');
    timbre.on('play', function() {
      return changeFavicon('play');
    });
    timbre.on('pause', function() {
      return changeFavicon('pause');
    });
    current = null;
    window.goto = function(page) {
      var prev;

      prev = current;
      return $.get("./docs/" + page + ".coffee").then(function(res) {
        var obj, url;

        url = "" + location.origin + location.pathname + "\#" + page;
        window.history.pushState(null, null, url);
        editor.setValue(res);
        obj = localStorage.getItem("" + page + ".cursor");
        if (obj) {
          obj = JSON.parse(obj);
          editor.moveCursorTo(obj.row, 0);
          editor.moveCursorToPosition(obj.pos);
        }
        editor.clearSelection();
        return current = page;
      });
    };
    window.reload = function() {
      return location.reload();
    };
    $(window).on('hashchange', gotoHash = function() {
      var hash;

      hash = location.hash.substr(1);
      if (hash !== '') {
        return goto(hash);
      } else {
        return goto('index');
      }
    });
    return gotoHash();
  });

}).call(this);
