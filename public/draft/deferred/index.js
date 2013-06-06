(function() {
  $(function() {
    'use strict';
    var DeferredKlass, a;

    DeferredKlass = Deferred;
    console.log("use: my deferred");
    a = new DeferredKlass;
    a.then(function(value) {
      console.log("(1): value " + value + " [10]");
      return 20;
    });
    a.then(function(value) {
      console.log("(2): value " + value + " [10]");
      return 30;
    });
    a.then(function(value) {
      console.log("(3): value " + value + " [10]");
      return 40;
    });
    a.resolve(10);
    console.log("-----");
    a = new DeferredKlass;
    a.then(function(value) {
      console.log("(1): value " + value + " [10]");
      return 20;
    }).then(function(value) {
      console.log("(2): value " + value + " [20]");
      return 30;
    }).then(function(value) {
      console.log("(3): value " + value + " [30]");
      return 40;
    });
    a.resolve(10);
    console.log("-----");
    a = new DeferredKlass;
    a.then(function(value) {
      var dfd;

      console.log("(1): value " + value + " [10]");
      dfd = new $.Deferred();
      setTimeout((function() {
        return dfd.resolve(20);
      }), 500);
      return dfd.promise();
    }).then(function(value) {
      var dfd;

      console.log("(2): value " + value + " [20]");
      dfd = new $.Deferred();
      setTimeout((function() {
        return dfd.resolve(30);
      }), 500);
      return dfd.promise();
    }).then(function(value) {
      var dfd;

      console.log("(3): value " + value + " [30]");
      dfd = new $.Deferred();
      setTimeout((function() {
        return dfd.resolve(40);
      }), 500);
      return dfd.promise();
    });
    return a.resolve(10);
  });

}).call(this);
