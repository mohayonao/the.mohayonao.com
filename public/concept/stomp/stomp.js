(function() {
  "use strict";

  var stomp = {};

  var AUDIO   = stomp.AUDIO   = 0;
  var CONTROL = stomp.CONTROL = 1;

  stomp.require = (function() {
    var scripts = document.getElementsByTagName("script");
    var scriptUrl = (function() {
      var matcher = /^(.*)\/stomp(\-\w+)?\.js(\?|$)/;
      for (var i = 0; i < scripts.length; ++i) {
        var match = matcher.exec(scripts[i].src);
        if (match) { return match[1]; }
      }
    })();
    var required = {};
    return function(moduleName) {
      if (required[moduleName]) {
        return;
      }
      required[moduleName] = true;
      var script = document.createElement("script");
      script.async = true;
      script.src = scriptUrl + "/" + moduleName + ".js";
      scripts[0].parentNode.insertBefore(script, 0);
    };
  })();

  stomp.extend = function(child, parent) {
    parent = parent || UGen;

    for (var key in parent) {
      if (parent.hasOwnProperty(key)) {
        child[key] = parent[key];
      }
    }
    function ctor() {
      this.constructor = child;
    }
    ctor.prototype  = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
  };
  
  stomp.register = (function() {
    var clone = function(object) {
      var clone = {};
      for (var key in object) {
        clone[key] = new TypeInference(object[key]);
      }
      return clone;
    };
    var optparse = function(arglist) {
      if (Array.isArray(arglist)) {
        var template = {};
        var argkeys  = new Array(arglist.length);
        arglist.forEach(function(x, i) {
          var key = Object.keys(x)[0];
          template[key] = x[key];
          argkeys[i] = key;
        });
        return function(args) {
          var opts = clone(template);
          var args = Array.prototype.slice.call(args);
          var peek = args[args.length-1];
          if (typeof peek === "object" && peek.constructor === Object) {
            var _opts = args.pop();
            for (var key in _opts) {
              opts[key] = new TypeInference(_opts[key]);
            }
          }
          var i, imax = Math.min(argkeys.length, args.length);
          for (i = 0; i < imax; ++i) {
            opts[argkeys[i]] = new TypeInference(args[i]);
          }
          opts.args = args.slice(i);
          return opts;
        };
      } else {
        return function() { return {}; };
      }
    };
    return function(key, ctor, opts) {
      var parser = optparse(opts.args);
      switch (opts.type) {
      case "gen":
        stomp[key] = (function(parser) {
          return function() {
            var opts = parser(arguments);
            opts.rate = AUDIO;
            return new ctor(opts);
          };
        })(parser);
        stomp[key].ar = stomp[key];
        stomp[key].kr = (function(parser) {
          return function() {
            var opts = parser(arguments);
            opts.rate = CONTROL;
            return new ctor(opts);
          };
        })(parser);
        break;
      case "op":
        UGen.prototype[key] = (function(parser) {
          return function() {
            var opts = parser(arguments);
            opts.a = this;
            opts.rate = this.rate;
            return new ctor(opts);
          };
        })(parser);
        break;
      }
    };
  })();

  var _objects = [];
  var _tickId  = 0;

  stomp.play = function() {

    pico.play(stomp);
  };
  stomp.pause = function() {
    pico.pause();
  };
  stomp.clear = function() {
    _objects.splice(0);
  };
  
  stomp.process = function(L, R) {
    var i, imax = _objects.length;
    var j, jmax = L.length;
    var cell;
    for (j = 0; j < jmax; ++j) {
      L[j] = R[j] = 0;
    }
    ++_tickId;
    for (i = 0; i < imax; ++i) {
      cell = _objects[i].process().cell;
      for (j = 0; j < jmax; ++j) {
        L[j] = (R[j] += cell[j]);
      }
    }
  };

  var UGen = stomp.UGen = (function() {
    function UGen(opts) {
      this.cell = new Float32Array(128);
      this.samplerate = stomp.samplerate;
      this.rate = opts.rate;
      this._tickId    = -1;
      this._calcFunc  = null;
      this._mulIn = opts.mul || null;
      this._addIn = opts.add || null;
    }
    UGen.prototype.play = function() {
      _objects.push(this);
      return this;
    };
    UGen.prototype.pause = function() {
      var index = _objects.indexOf(this);
      if (index !== -1) {
        _objects.splice(index, 1);
      }
      return this;
    };
    UGen.prototype.process = function() {
      var cell = this.cell;
      var samples = cell.length;
      var i, mul, add;
      if (this._tickId !== _tickId) {
        this._tickId = _tickId;
        if (this._calcFunc) {
          this._calcFunc();
          if (this._mulIn) {
            mul = this._mulIn.process().value;
          } else {
            mul = 1;
          }
          if (this._addIn) {
            add = this._addIn.process().value;
          } else {
            add = 0
          }
          for (i = 0; i < samples; ++i) {
            cell[i] = cell[i] * mul + add;
          }
          this.value = cell[samples-1];
        }
      }
      return this;
    };
    return UGen;
  })();

  var TypeInference = function(value) {
    if (value instanceof UGen) {
      return value;
    } else if (typeof value === "number") {
      return new stomp.Number(value);
    }
    return new stomp.Number(0);
  };
  
  (function() {
    function Number(opts) {
      UGen.call(this, opts);
      var value = opts.args[0] || 0;
      var cell = this.cell;
      for (var i = 0, imax = cell.length; i < imax; ++i) {
        cell[i] = value;
      }
      this.value = value;      
    }
    stomp.extend(Number);

    stomp.register("Number", Number, {
      type: "gen",
      args: []
    });
  })();

  (function() {
    function OpMul(opts) {
      UGen.call(this, opts);
      this.aIn = opts.a;
      this.bIn = new TypeInference(opts.args[0]);
      this._calcFunc = mul_aa;
    }
    stomp.extend(OpMul);

    var mul_aa = function() {
      var cell = this.cell;
      var samples = cell.length;
      var aIn, bIn;
      var i;

      aIn = this.aIn.process().cell;
      bIn = this.bIn.process().cell;
      
      for (i = 0; i < samples; ++i) {
        cell[i] = aIn[i] * bIn[i];
      }
      return this;
    };

    stomp.register("mul", OpMul, {
      type: "op",
      args: []
    });
  })();

  //
  stomp.samplerate = pico.samplerate;

  // exports
  window.stomp = stomp;

})();
