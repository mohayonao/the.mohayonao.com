var Deferred = (function() {
  var PENDING = 0, RESOLVED = 1, REJECTED = 2;
  function Deferred() {
    var _pendings = [];
    var _status   = PENDING;
    var _value    = null;
    var done = function(status, value) {
      if (_status === PENDING) {
        _status = status;
        _value  = value;
        _pendings.forEach(function(items) {
          if (items.type === status) {
            items.callback(value);
          }
        });
        _pendings = null;
      }
    };
    var then = function(status, callback) {
      if (typeof callback === "function") {
        if (_status === status) {
          callback(_value);
        } else if (_status === PENDING) {
          _pendings.push({type:status, callback:callback});
        }
      }
    };
    var chain = function(callback, next, which) {
      if (typeof callback === "function") {
        return function(value) {
          var res = callback(value);
          if (res && typeof res.then === "function") {
            res.then(function(value) {
              next.resolve(value);
            }, function(value) {
              next.reject(value);
            });
          } else {
            which(res);
          }
        };
      }
    };
    this.resolve = function(value) {
      done(RESOLVED, value);
      return this;
    };
    this.reject = function(value) {
      done(REJECTED, value);
      return this;
    };
    this.then = function(resolved, rejected) {
      var next = new Deferred();
      then(RESOLVED, chain(resolved, next, next.resolve));
      then(REJECTED, chain(rejected, next, next.reject ));
      return next.promise();
    };
    this.promise = function() {
      return new Promise(this);
    };
  }
  function Promise(dfd) {
    this.then = function(resolved, rejected) {
      return dfd.then(resolved, rejected);
    };
    this.promise = function() {
      return this;
    };
  }
  Deferred.when = function() {
    var dfd = new Deferred();
    var count = arguments.length;
    if (count) {
      var resolved = function() {
        if (!--count) { dfd.resolve(); }
      };
      var rejected = function() {
        dfd.rejected();
      };
      for (var i = 0, imax = count; i < imax; ++i) {
        arguments[i].then(resolved, rejected);
      }
    } else {
      dfd.resolve();
    }
    return dfd.promise();
  };
  return Deferred;
})();
