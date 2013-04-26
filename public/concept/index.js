(function() {
  $(function() {
    'use strict';
    var editor, gotoHash;

    editor = ace.edit('editor');
    editor.setTheme('ace/theme/github');
    editor.getSession().setTabSize(4);
    editor.getSession().setMode('ace/mode/coffee');
    editor.focus();
    editor.commands.addCommand({
      name: 'play',
      bindKey: {
        win: 'Ctrl-Enter',
        mac: 'Command-Enter'
      },
      exec: function(editor) {
        var code, sess;

        sess = editor.session;
        code = sess.getTextRange(editor.getSelectionRange());
        if (code === '') {
          code = sess.getLine(editor.getCursorPosition().row);
        }
        code = CoffeeScript.compile(code, {
          bare: true
        });
        return eval.call(window, code);
      }
    });
    editor.commands.addCommand({
      name: 'stop',
      bindKey: {
        win: 'Ctrl-.',
        mac: 'Command-.'
      },
      exec: function(editor) {
        return stomp.clear();
      }
    });
    window.goto = function(page) {
      return $.get("./docs/" + page + ".coffee").then(function(res) {
        var url;

        url = "" + location.origin + location.pathname + "\#" + page;
        window.history.pushState(null, null, url);
        editor.setValue(res);
        return editor.gotoLine(0);
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
    gotoHash();
    stomp.require("SinOsc");
    return stomp.play();
  });

}).call(this);
