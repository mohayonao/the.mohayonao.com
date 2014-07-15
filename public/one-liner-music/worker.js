(function() {
  'use strict';
  var evalFunction;

  evalFunction = function(f) {
    return eval("(function() {\nvar self,location,navigator,onmessage,postMessage,importScripts,close,setInterval,setTimeout,XMLHttpRequest,Worker;\nreturn function(t) { return " + f + "; };\n})()");
  };

  (function(_this) {
    return (function(evalFunction) {
      var func, tcnt, update;
      func = function(t) {
        return 0;
      };
      tcnt = 0;
      update = function(t) {
        var e, i, stream, _i, _ref;
        stream = new Array(4096);
        try {
          for (i = _i = 0, _ref = stream.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            stream[i] = (func(t++)) | 0;
          }
          return stream;
        } catch (_error) {
          e = _error;
          return null;
        }
      };
      _this.onmessage = function(e) {
        var err, res;
        if (typeof e.data === 'string') {
          try {
            func = evalFunction(e.data);
            func((Math.random() * 65536) | 0);
            return _this.postMessage('accept');
          } catch (_error) {
            err = _error;
            func = function(t) {
              return 0;
            };
            return _this.postMessage('error');
          }
        } else {
          res = update(tcnt);
          if (res === null) {
            return _this.postMessage('error');
          } else {
            tcnt += res.length;
            return _this.postMessage(res);
          }
        }
      };
      _this.postMessage('ready');
      return 0;
    });
  })(this)(evalFunction);

}).call(this);
