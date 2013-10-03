$ ->
  'use strict'

  WavDecoder.load("./drumkit.wav").then (wav)->
    waves = []
    len = wav.buffer[0].length >> 2
    waves[0] = wav.buffer[0].subarray len * 0, len * 1
    waves[1] = wav.buffer[0].subarray len * 1, len * 2
    waves[2] = wav.buffer[0].subarray len * 2, len * 3
    waves.samplerate = wav.samplerate

    hrm = new HexRhythmMachine(pico.samplerate, waves)

    isPlaying = false
    $('#play').on 'click', ->
      isPlaying = not isPlaying
      if isPlaying
        hrm.setPattern $("#p").val()
        pico.play(hrm)
        $(this).css 'color', 'red'
      else
        pico.pause()
        $(this).css 'color', 'black'

    prev = $("#p").val()
    $("#p").on 'keyup', ->
      val = $("#p").val()
      if val isnt prev
        hrm.setPattern val
      prev = val

  0

