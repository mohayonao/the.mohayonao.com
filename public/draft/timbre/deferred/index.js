(function() {
  describe('deferred', function() {
    return it('new', function() {
      return assert.doesNotThrow(function() {
        return new timbre.Deferred;
      });
    });
  });

}).call(this);
