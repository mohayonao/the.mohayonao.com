(function() {
  $(function() {
    'use strict';
    var changeFavicon, current, editor, gotoHash;

    sc.use('prototype');
    editor = ace.edit('editor');
    editor.setTheme('ace/theme/github');
    editor.setPrintMarginColumn(-1);
    editor.getSession().setTabSize(4);
    editor.getSession().setMode('ace/mode/coffee');
    editor.focus();
    editor.commands.addCommand({
      name: 'play',
      bindKey: 'Ctrl-Enter',
      exec: function(editor) {
        var code, err, sess;

        sess = editor.session;
        code = sess.getTextRange(editor.getSelectionRange());
        if (code === '') {
          code = sess.getLine(editor.getCursorPosition().row);
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
