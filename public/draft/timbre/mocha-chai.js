var assert = chai.assert;
mocha.setup('bdd');

$(function() {
  setTimeout(function() {
    if (assert.dfd) {
      assert.dfd.then(function() {
        mocha.run();
      });
    } else {
      mocha.run();
    }
  }, 0);
});
