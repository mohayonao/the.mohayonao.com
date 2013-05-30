(function() {
  $(function() {
    'use strict';
    var count, countdown, dfd, head, tests;

    dfd = assert.dfd = new $.Deferred;
    tests = ['deferred', 'require'];
    count = tests.length;
    countdown = function() {
      count -= 1;
      if (count === 0) {
        return dfd.resolve();
      }
    };
    head = $('script')[0];
    return tests.forEach(function(name) {
      return head.parentNode.insertBefore($('<script>').attr({
        async: true,
        src: "./" + name + "/index.js"
      }).on('load', countdown)[0], head);
    });
  });

}).call(this);
