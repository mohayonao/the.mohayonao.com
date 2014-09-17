(function() {
  'use strict';
  var $test, audioContext, bufSrc, buffer, xhr;

  audioContext = new AudioContext;

  bufSrc = null;

  buffer = null;

  $test = $('#test');

  $test.on('click', function() {
    var amp, osc;
    if (bufSrc) {
      bufSrc.stop();
      bufSrc = null;
      return;
    }
    if (buffer) {
      bufSrc = audioContext.createBufferSource();
      bufSrc.buffer = buffer;
      bufSrc.loop = true;
      osc = audioContext.createOscillator();
      osc.frequency.value = 0.25;
      amp = audioContext.createGain();
      amp.gain.value = 0.5;
      osc.connect(amp);
      amp.connect(bufSrc.playbackRate);
      osc.start(0);
      bufSrc.start(0);
      return bufSrc.connect(audioContext.destination);
    }
  });

  $test.attr('disabled', 'disabled');

  xhr = new XMLHttpRequest;

  xhr.open('GET', './amen.wav');

  xhr.responseType = 'arraybuffer';

  xhr.onload = function() {
    return audioContext.decodeAudioData(xhr.response, function(result) {
      buffer = result;
      return $test.removeAttr('disabled');
    });
  };

  xhr.send();

}).call(this);
