(function() {
  if (window.AudioContext == null) {
    window.AudioContext = window.webkitAudioContext;
  }

  window.onload = function() {
    'use strict';
    var audioContext, editor, player, sound, vue;
    sound = [
      {
        name: 'amen',
        url: 'sound/amen.wav',
        duration: 0
      }
    ];
    audioContext = new AudioContext();
    editor = CodeMirror.fromTextArea(document.getElementById('data'), {
      mode: 'javascript',
      theme: 'monokai',
      workTime: 200,
      lineNumbers: true,
      matchBrackets: true
    });
    player = new CiseauxPlayer(audioContext, document.getElementById('canvas'));
    vue = new Vue({
      el: '#app',
      data: {
        sound: sound
      },
      methods: {
        play: function() {
          if (player.isPlaying) {
            return player.stop();
          } else {
            return player.chore().exec(editor.getValue());
          }
        },
        save: function() {},
        tweet: function() {}
      }
    });
    Promise.all(sound.map(function(_arg) {
      var url;
      url = _arg.url;
      return Ciseaux.from(url, audioContext);
    })).then(function(tapes) {
      return tapes.forEach(function(tape, index) {
        window["tape" + (index + 1)] = tape;
        return vue.$data.sound[index].duration = tape.duration.toFixed(2);
      });
    });
    return 0;
  };

}).call(this);
