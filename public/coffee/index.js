(function() {
  $(function() {
    'use strict';
    var $dst, $nodes, $src, $tokens, hash, prev, view;

    $src = $('#src');
    $tokens = $('#tokens');
    $nodes = $('#nodes');
    $dst = $('#dst');
    prev = null;
    $src.on('keyup', function() {
      var src;

      src = $src.val().trim();
      if (src === prev) {
        return;
      }
      if (view(src)) {
        return prev = src;
      }
    });
    view = function(src) {
      var dst, e, list, nodes, tokens;

      try {
        tokens = CoffeeScript.tokens(src);
        list = tokens.map(function(items) {
          var tag;

          tag = (items[0] + '                    ').substr(0, 20);
          return "" + tag + items[1];
        });
        $tokens.val(list.join('\n'));
        nodes = CoffeeScript.nodes(tokens);
        dst = nodes.compile({
          bare: true
        });
        $dst.val(dst);
        $src.css('color', 'black');
        return true;
      } catch (_error) {
        e = _error;
        $src.css('color', 'red');
        return false;
      }
    };
    $('#link').on('click', function() {
      var code;

      code = $src.val().trim();
      return window.location = "#" + (encodeURIComponent(code));
    });
    hash = decodeURIComponent(location.hash.substr(1));
    if (hash) {
      $src.val(hash);
      return view(hash);
    }
  });

}).call(this);
