;(function(global) {
  "use strict";

  var timbre = function() {
    console.log("timbre.js");
  };
  timbre.modules = {};

  var Deferred = (function() {
    // implement a bare-bones
    function Deferred() {
      var _pendings   = [];
      var _isResolved = false;
      var _resolveValue;
      this.resolve = function(resolveValue) {
        if (!_isResolved) {
          _isResolved   = true;
          _resolveValue = resolveValue;
          _pendings.forEach(function(callback) {
            callback.call(this, _resolveValue);
          }, this);
          _pendings = null;
        }
        return this;
      };
      this.then = function(callback) {
        if (_isResolved) {
          callback.call(this, _resolveValue);
        } else {
          _pendings.push(callback);
        }
        return this;
      };
      this.promise = function() {
        return new Promise(this);  
      };
    }
    function Promise(that) {
      this.then = function(callback) {
        that.then(callback);
        return this;
      };
    }
    Deferred.when = function() {
      var dfd = new Deferred();
      var count = arguments.length;
      if (count) {
        var countdown = function() {
          count -= 1;
          if (!count) {
            dfd.resolve();
          }
        };
        for (var i = 0, imax = count; i < imax; i++) {
          arguments[i].then(countdown);
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    };
    return Deferred;
  })();
  timbre.modules.Deferred = Deferred;

  // require
  (function() {
    var _requires = {}, _defines = {}, scriptStack = [];
    timbre.define = function(name, deps, payload) {
      if (!_requires[name]) {
        _requires[name] = new Deferred();
      }
      if (!_defines[name]) {
        _defines[name] = new Deferred();
      }
      console.log(scriptStack);
      if (arguments.length === 2) {
        payload = deps;
        deps    = [];
      }
      if (!Array.isArray(deps)) {
        deps = [ deps ];
      }
      _requires[name].then(function() {
        Deferred.when.apply(null, deps.map(timbre.require)).then(function() {
          if (typeof payload === "function") {
            timbre.modules[name] = payload(timbre);
          } else {
            timbre.modules[name] = payload;
          }
          _defines[name].resolve();
        });
      });
    };
    timbre.require = function(path) {
      var name = resolveModuleName(path);
      if (!_requires[name]) {
        _requires[name] = new Deferred();
        loadScript(resolvePath(path, name));
      }
      if (!_defines[name]) {
        _defines[name] = new Deferred();
      }
      _requires[name].resolve();
      return _defines[name].promise();
    };
    var scriptHead, scriptUrl;
    (function() {
      var m, scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || scripts[i].getAttribute("src");
        if (!src) continue;
        if ((m = src.match(/^(.*)\/timbre(\-\w+)?\.js(\?|$)/)))
          break;
      }
      scriptHead = scripts[0];
      scriptUrl  = m && m[1];
    })();
    var loadScript = function(filepath, name) {
      var script = document.createElement("script");
      script.async = true;
      script.src   = filepath;
      scriptStack.push(filepath);
      script.onload = function() {
        console.log("LOAD");
      };
      script.onerror = function() {
        console.log("ERROR");
      };
      scriptHead.parentNode.insertBefore(script, scriptHead);
    };
    var resolveModuleName = function(path) {
      var items = path.split("/");
      var name = items[items.length-1];
      name = name.replace(/\.js$/, "");
      return name;
    };
    var resolvePath = function(path) {
      if (path.match(/^(https?:)?\/\//)) {
        return path;
      }
      if (!path.match(/\.js$/)) {
        path += ".js";
      }
      return path;
    };
    timbre.require.resolvePath = resolvePath;
  })();
  
  /*
  (function() {
    var scriptHead, scriptUrl;
    (function() {
      var m, scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || scripts[i].getAttribute("src");
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
          deps = [deps];
        }
        Deferred.when.apply(null, deps.map(timbre.require)).then(function() {
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
  */
  
  // exports
  var exports = timbre;
  
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  } else {
    window.T = exports;
  }
  global.timbre = exports;

})(this.self||global);
