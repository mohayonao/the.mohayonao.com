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

    $p = $("#p")

    isPlaying = false
    $('#play').on 'click', ->
      isPlaying = not isPlaying
      if isPlaying
        hrm.setPattern $p.val()
        pico.play hrm
        $(this).css 'color', 'red'
      else
        pico.pause()
        $(this).css 'color', 'black'

    prev = $p.val()
    
    setPattern = ->
      val = $p.val().trim()
      if val isnt prev
        if hrm.validate val
          hrm.setPattern val
          $p.css 'color', 'black'
        else
          $p.css 'color', 'red'
      prev = val
    $p.on 'keyup', setPattern

    $("#tweet").on 'click', ->
      val = $p.val().trim()
      if hrm.validate val
        text = '6chars drums'
        url  = "http://#{location.host}/6chars/##{encodeURI(val)}"
        apps.tweet text:text, url:url

    if location.hash
      hash = decodeURI location.hash.substr(1).trim()
      if hrm.validate hash
        $p.val(hash)
        do setPattern
        if apps.isDesktop
          do $('#play').click
  0
