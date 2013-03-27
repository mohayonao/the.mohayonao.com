(function() {
  $(function() {
    'use strict';    if (apps.isPhone) {
      return $('#sidebar').show().css({
        width: '100%'
      }).appendTo($('#content').empty());
    }
  });

}).call(this);
