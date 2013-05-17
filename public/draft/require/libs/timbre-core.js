;(function(global) {
  "use strict";

  var Deferred = $.Deferred;

  var timbre = function() {
    console.log("timbre.js");
  };
  timbre.modules = {};

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
    var normalizeModule = function(parentId, moduleName) {
      if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return normalizeModule(parentId, chunks[0]) + "!" + normalizeModule(parentId, chunks[1]);
      }
      if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = base + "/" + moduleName;

        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
          var previous = moduleName;
          moduleName = moduleName.replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
      }

      return moduleName;
    };
    var name2path = function(name) {
      if (!/^https?:\/\//.test(name)) {
        name = scriptUrl + "/" + name + ".js";
      }
      return name;
    };
    var loadScript = function(name) {
      var path = name2path(name);
      var script = document.createElement("script");
      script.async = true;
      script.src   = path;
      scriptHead.parentNode.insertBefore(script, scriptHead);
    };

    var _modules = {};

    timbre.define = function(name, deps, define) {
      if (arguments.length === 2) {
        define = deps;
        deps   = null;
      }

      var dfd = _modules[name] || (_modules[name] = new Deferred());

      if (deps) {
        if (!Array.isArray(deps)) {
          deps = [deps]
        }
        $.when.apply(null, deps.map(timbre.require)).then(function() {
          timbre.modules[name] = define(timbre);
          dfd.resolve(timbre);
        });
      } else {
        timbre.modules[name] = define(timbre);
        dfd.resolve(timbre);
      }
      return dfd.promise();
    };
    
    timbre.require = function(name) {
      name = normalizeModule("", name);
      if (_modules[name]) {
        console.log("%crequire: " + name, "color:gray;text-decoration:line-through");
        return _modules[name].promise();
      } else if (name) {
        console.log("require: " + name);
        var dfd = _modules[name] = new Deferred();
        loadScript(name);
        return dfd.promise();
      }
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
