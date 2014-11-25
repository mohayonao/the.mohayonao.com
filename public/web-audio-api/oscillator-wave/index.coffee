$ ->
  'use strict'

  SAMPLERATE = 44100

  Settings = [
    { type: "sine", freq: 1 }
    { type: "square", freq: 1 }
    { type: "sawtooth", freq: 1 }
    { type: "triangle", freq: 1 }
    { type: "sine", freq: 10 }
    { type: "square", freq: 10 }
    { type: "sawtooth", freq: 10 }
    { type: "triangle", freq: 10 }
    { type: "sine", freq: 441 }
    { type: "square", freq: 441 }
    { type: "sawtooth", freq: 441 }
    { type: "triangle", freq: 441 }
    { type: "sine", freq: 882 }
    { type: "square", freq: 882 }
    { type: "sawtooth", freq: 882 }
    { type: "triangle", freq: 882 }
  ]

  capture = (type, freq, callback)->
    length = Math.ceil SAMPLERATE / freq
    audioContext = new OfflineAudioContext(1, length, SAMPLERATE)

    audioContext.oncomplete = (e)->
      buffer = e.renderedBuffer.getChannelData 0

      callback buffer

    oscillator = audioContext.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = freq

    oscillator.start 0

    oscillator.connect audioContext.destination

    do audioContext.startRendering

  draw = (setting, canvas)->
    capture setting.type, setting.freq, (data)->
      context = canvas.getContext '2d'

      context.fillStyle = '#000'
      context.fillRect 0, 0, canvas.width, canvas.height

      context.strokeStyle = '#0c0'
      context.beginPath()

      for i in [0...data.length] by 1
        x = Math.round (i / (data.length - 1)) * canvas.width
        y = canvas.height * 0.5 - data[i] * canvas.height * 0.5

        context.lineTo x, y

      context.stroke()

      context.fillStyle = '#0f0'

      text = "type= " + setting.type + "; freq= " + setting.freq + "Hz"
      textWidth = context.measureText(text).width

      context.fillText text, canvas.width - textWidth - 4, 12

  $('canvas').each (i, elem)->
    elem.width  = 240
    elem.height = 120
    if Settings[i]
      draw Settings[i], elem
