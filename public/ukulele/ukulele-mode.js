CodeMirror.defineMode("ukulele", function() {

  var stroke = /^!\d*(?::3)?[-PpDdUuXx,_=]*/
  var chord  = /^[CDEFGAB][\#b]?(?:m7\(b5\)|M7\(9\)|7\(9\)|sus4|add9|aug|dim|mM7|m7|M7|m|7|6)?(?:@[0-5]{4})?/;

  return {
    token: function(stream, state) {
      var w;
      if (stream.eat(";")) {
        return "newline";
      } else if (stream.eat(/[()]/)) {
        return "blacket";
      } else if (stream.eat(/[-1234$<^*]/) || stream.match("|:") || stream.match(":|")) {
        return "repeat";
      } else if (stream.eat(/[_=]/)) {
        return "space";
      } else if (stream.match(stroke)) {
          return "stroke";
      } else if (stream.match(chord)) {
        return "chord";
      } else {
        w = stream.next();
      }
      return null;
    }
  };
});
