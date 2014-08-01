(function() {
  $(function() {
    'use strict';
    var bufSrc, context, decode, jsNode, play;
    context = new AudioContext;
    bufSrc = context.createBufferSource();
    jsNode = context.createScriptProcessor(1024, 1, 1);
    jsNode.onaudioprocess = function(e) {
      return e.outputBuffer.getChannelData(0).set(e.inputBuffer.getChannelData(0));
    };
    decode = function(path, callback) {
      var xhr;
      xhr = new XMLHttpRequest;
      xhr.open('get', path);
      xhr.responseType = 'arraybuffer';
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          bufSrc.buffer = context.createBuffer(xhr.response, true);
          return callback();
        }
      };
      return xhr.send();
    };
    play = function() {
      if (typeof bufSrc.noteOn === "function") {
        bufSrc.noteOn(0);
      }
      bufSrc.connect(jsNode);
      jsNode.connect(context.destination);
      return $(window).on('click', function() {
        return jsNode.disconnect();
      });
    };
    decode('sample.ogg', function() {
      return window.postMessage('bang', '*');
    });
    return window.onmessage = function(e) {
      if (e.data === 'bang') {
        return play();
      }
    };
  });

}).call(this);
