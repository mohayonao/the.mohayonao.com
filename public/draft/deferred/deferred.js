var Deferred = (function() {
  function Deferred() {
    this.status = "PENDING";
    this.value  = null;
    this._pendings = [];
  }
  Deferred.prototype.resolve = function(value) {
    return done(this, "RESOLVED", value);
  };
  Deferred.prototype.reject = function(value) {
    return done(this, "REJECTED", value);
  };
  Deferred.prototype.then = function(resolved, rejected) {
    var next = new Deferred();
    then(this, "RESOLVED", chain(resolved, next, next.resolve));
    then(this, "REJECTED", chain(rejected, next, next.reject ));
    return next.promise();
  };
  Deferred.prototype.promise = function() {
    return new Promise(this);
  };
  var done = function(that, status, value) {
    if (that.status === "PENDING") {
      that.status = status;
      that.value  = value;
      that._pendings.forEach(function(items) {
        if (items.type === status) { items.callback(value); }
      });
      that._pendings = null;
    }
    return that;
  };
  var then = function(that, status, callback) {
    if (typeof callback === "function") {
      if (that.status === status) {
        callback(that.value);
      } else if (that.status === "PENDING") {
        that._pendings.push({type:status, callback:callback});
      }
    }
  };
  var chain = function(callback, next, which) {
    if (typeof callback === "function") {
      return function(value) {
        var res = callback(value);
        if (res && typeof res.then === "function") {
          res.then(function(value) { next.resolve(value); },
                   function(value) { next.reject (value); });
        } else { which.call(next, res); }
      };
    }
  };
  function Promise(dfd) {
    this.then = function(resolved, rejected) {
      return dfd.then(resolved, rejected);
    };
    this.promise = function() { return this; };
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
