$ ->
  'use strict'

  AudioContext = window.AudioContext or window.webkitAudioContext

  a = new AudioContext()
  b = null
  c = null

  $('#start').on 'click', ->
    if b is null
      b = a.createOscillator()
      c = a.createWaveShaper()
      c.curve = new Float32Array([ -1, +1 ])
      b.connect c
      c.connect a.destination
      b.start a.currentTime
    else
      b.stop a.currentTime
      b.disconnect()
      c.disconnect()
      b = c = null
