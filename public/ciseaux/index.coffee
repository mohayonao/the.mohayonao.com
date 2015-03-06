window.AudioContext ?= window.webkitAudioContext

window.onload = ()->
  'use strict'

  sound = [
    { name: 'amen', url: 'sound/amen.wav', duration: 0 }
  ]

  audioContext = new AudioContext()

  editor = CodeMirror.fromTextArea document.getElementById('data'),
    mode: 'javascript', theme: 'monokai', workTime: 200, lineNumbers: true, matchBrackets: true,

  player = new CiseauxPlayer(audioContext, document.getElementById('canvas'))

  vue = new Vue
    el: '#app'
    data:
      sound: sound
    methods:
      play: ->
        if player.isPlaying
          player.stop()
        else
          player.chore().exec editor.getValue()
      save: ->
        # TODO: !!!
      tweet: ->
        # TODO: !!!

  Promise.all(sound.map ({ url })-> Ciseaux.from(url, audioContext)).then (tapes)->
    tapes.forEach (tape, index)->
      window["tape#{index + 1}"] = tape
      vue.$data.sound[index].duration = tape.duration.toFixed 2

  0
