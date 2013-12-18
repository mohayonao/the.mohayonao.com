(function() {
  $(function() {
    'use strict';
    var enz, height, id, opt, patcher, source, width;
    id = 'enzui';
    width = 550;
    height = 400;
    source = '# patch[0]\n$XY=0,0\n$ZOOM=1\n[_01 -220,-160,20,20 button]\n\n[_02 -120,-100,80,20 delay 50]\n[_05 -220,-60,80,20 number 987.7666025122483]\n[_06 -120,-60,80,20 number 1318.5102276514797]\n(_01:1->1:_05)\n(_01:1->1:_02)\n(_02:1->1:_06)\n\n[_10 -220,0,80,20 rect~]\n(_05:1->1:_10)\n(_06:1->1:_10)\n\n[_11 -220,40,80,20 *~ 0.3]\n(_10:1->1:_11)\n\n[_20 -120,-25,80,20 message 1,0.0 1000]\n[_21 -120,0,80,20 line~]\n(_01:1->1:_20)\n(_20:1->1:_21)\n(_21:1->2:_11)\n\n[_99 -220,80,60,20 dac~]\n(_11:1->1:_99)\n(_11:1->2:_99)\n__END__';
    enz = enzui(pico);
    opt = {
      target: id,
      width: width,
      height: height,
      source: source
    };
    patcher = enz.newPatcherWindow(id, opt);
    enz.start();
    source += '\n' + $('#desc').text();
    return $('#load').on('click', function() {
      var dfd, src;
      src = $('#src').val().trim();
      if (src) {
        dfd = $.get("src/" + src + ".enz");
      } else {
        dfd = $.Deferred();
        dfd.resolve(source);
      }
      return dfd.then(function(result) {
        var doc, index;
        index = result.indexOf('__END__');
        if (index !== -1) {
          src = result.substr(0, index).trim();
          doc = result.substr(index + 7).trim();
        } else {
          src = result.trim();
          doc = '';
        }
        patcher.stop();
        patcher.execute(src);
        doc = doc.replace(/\n/g, '<br/>');
        return $('#desc').html(doc);
      });
    });
  });

}).call(this);
