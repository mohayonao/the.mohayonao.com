(function() {
  describe('require', function() {
    it('`define` will not be executed until it is `require`', function() {
      var defined;

      defined = false;
      timbre.define('test(1)', function() {
        console.log('defined: test(1)');
        return defined = true;
      });
      assert.equal(defined, false, 'define');
      timbre.require('test(1)');
      return assert.equal(defined, true, 'require');
    });
    it('deps', function() {
      var defined;

      defined = 0;
      timbre.define('test(2)', ['test(3)', 'test(4)'], function() {
        return defined *= 100;
      });
      timbre.define('test(3)', ['test(4)'], function() {
        return defined *= 2;
      });
      timbre.define('test(4)', function() {
        return defined += 1;
      });
      assert.equal(defined, 0, 'define');
      timbre.require('test(2)');
      return assert.equal(defined, 200, 'require');
    });
    return it('require', function() {
      return timbre.require('./test-module').then(function() {
        return assert.equal(timbre.modules['test-module'], 100);
      });
    });
  });

}).call(this);
