;(function(global) {
  "use strict";

  var timbre = function() {
  };

  // require
  (function() {
    var scriptHead, scriptUrl;
    (function() {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var m, src = scripts[i].src || scripts[i].getAttribute("src");
        if (!src) continue;
        if ((m = src.match(/^(.*)\/timbre(\-\w+)?\.js(\?|$)/)))
          break;
      }
      scriptHead = scripts[0];
      scriptUrl  = m && m[1];
    })();
    var loadScript = function(path, callback) {
      if (!/^https?:\/\//.test(path)) {
        path = scriptUrl + "/" + path + ".js";
      }
      var script = document.createElement("script");
      script.async  = true;
      script.src    = path;
      script.onload = script.onreadystatechange = function() {
        delete script.onload;
        delete script.onreadystatechange;
        if (callback) callback();
      };
      scriptHead.parentNode.insertBefore(script, scriptHead);
    };

    var _modules = {};

    // TODO: queuing???
    // a [b,c] => [b,c,a]   -> load b
    // b [c]   => [c,b,c,a] -> load c
    // c []    => [c,b,c,a]
    // defined c => [b,c,a]
    // defined b => [c,a]
    // skipped c => [a]
    // defined a => []
    timbre.define = function(name, deps, define) {
      if (_modules[name]) {
        console.log("skipped " + name);
        return;
      }
      if (arguments.length === 2) {
        define = deps;
        deps   = null;
      }
      
      if (deps) {
        if (Array.isArray(deps)) {
          timbre.require(deps.shift(), function() {
            if (deps.length) {
              timbre.define(name, deps, define);
            } else {
              _modules[name] = define(timbre);
            }
          });
        } else {
          timbre.require(deps, function() {
            _modules[name] = define(timbre);
          });
        }
      } else {
        _modules[name] = define(timbre);
      }
    };
    
    timbre.require = function(name, callback) {
      if (_modules[name]) {
        if (callback) callback();
        return _modules[name];
      } else if (name) {
        loadScript(name, callback);
      }
      return null;
    };
  })();
  
  // exports
  var exports = timbre;
  
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  } else {
    window.T = exports;
  }
  global.timbre = exports;

})(this.self||global);
