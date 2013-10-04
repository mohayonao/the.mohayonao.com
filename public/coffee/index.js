(function() {
  $(function() {
    'use strict';
    var $dst, $nodes, $src, $tokens, prev;

    $src = $('#src');
    $tokens = $('#tokens');
    $nodes = $('#nodes');
    $dst = $('#dst');
    prev = null;
    return $src.on('keyup', function() {
      var dst, e, list, nodes, src, tokens;

      src = $src.val().trim();
      if (src === prev) {
        return;
      }
      try {
        tokens = CoffeeScript.tokens(src);
        list = tokens.map(function(items) {
          var tag;

          tag = (items[0] + '                    ').substr(0, 20);
          return "" + tag + items[1];
        });
        nodes = CoffeeScript.nodes(tokens);
        dst = nodes.compile({
          bare: true
        });
        $tokens.val(list.join('\n'));
        $dst.val(dst);
        $src.css('color', 'black');
      } catch (_error) {
        e = _error;
        $src.css('color', 'red');
      }
      return prev = src;
    });
  });

}).call(this);
