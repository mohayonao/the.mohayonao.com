$ ->
  'use strict'

  audioContext = new AudioContext()

  canvas = document.getElementById 'canvas'
  canvas.width  = 1024
  canvas.height = 512

  context = canvas.getContext '2d'
  context.fillStyle = '#ecf0f1'
  context.strokeStyle = '#2c3e50'
  context.lineWidth = 0.1

  zoom   = 1
  range  = 1
  buffer = null

  render = ->
    if buffer
      context.clearRect 0, 0, canvas.width, canvas.height
      ch = buffer.numberOfChannels
      for i in [0...ch] by 1
        data = buffer.getChannelData(i)
        data = data.subarray 0, Math.floor(data.length * range)
        draw data, i

  draw = (data, index)->
    width  = canvas.width
    height = canvas.height * 0.5
    cY = height * 0.5 + height * index
    length = data.length

    context.beginPath()
    for i in [0...data.length] by 1
      x = (i / length) * width
      y = cY - data[i] * height * zoom
      context.lineTo x, y
    context.stroke()

  main = (file)->
    reader = new FileReader
    reader.onload = (e)->
      audioContext.decodeAudioData e.target.result, (result)->
        buffer = result
        do render
    reader.readAsArrayBuffer file

  $(window).on 'dragover', ->
    false

  $(window).on 'drop', (e)->
    main e.originalEvent.dataTransfer.files[0]
    false

  $('#zoom').on 'change', _.throttle (e)->
    zoom = Math.pow 1.25, (e.target.value - 5)
    do render
  , 150

  $('#range').on 'change', _.throttle (e)->
    range = Math.pow 1.05, (e.target.value - 50)
    do render
  , 150
