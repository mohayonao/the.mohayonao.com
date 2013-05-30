(function() {
  describe('deferred', function() {
    var Deferred;

    Deferred = timbre.modules.Deferred;
    it('new', function() {
      return assert.instanceOf(new Deferred(), Deferred);
    });
    it('sync', function() {
      var a, dfd;

      dfd = new Deferred().resolve();
      a = 0;
      dfd.then(function() {
        return a += 5;
      });
      dfd.then(function() {
        return a *= 2;
      });
      return assert.equal(a, 10);
    });
    it('async', function(done) {
      var a, dfd;

      dfd = new Deferred();
      a = 0;
      setTimeout(function() {
        a += 5;
        return dfd.resolve();
      }, 25);
      dfd.then(function() {
        return a *= 2;
      });
      return dfd.then(function() {
        assert.equal(a, 10);
        return done();
      });
    });
    it('promise', function() {
      var a, dfd;

      dfd = new Deferred().resolve(100).promise();
      a = 0;
      dfd.then(function(b) {
        return a = b;
      });
      return assert.equal(a, 100);
    });
    it('when', function(done) {
      var a, b, dfd1, dfd2;

      dfd1 = new Deferred();
      dfd2 = new Deferred();
      a = b = 0;
      setTimeout(function() {
        a = 10;
        return dfd1.resolve();
      }, 25);
      setTimeout(function() {
        b = 20;
        return dfd2.resolve();
      }, 50);
      return Deferred.when(dfd1, dfd2).then(function() {
        assert.equal(a, 10);
        assert.equal(b, 20);
        return done();
      });
    });
    return it('empty when', function() {
      var a;

      a = 0;
      Deferred.when().then(function() {
        return a = 10;
      });
      return assert.equal(a, 10);
    });
  });

}).call(this);
