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

  zoom    = 1
  range   = 1
  buffer  = null
  timerId = 0
  renderSize = audioContext.sampleRate

  render = ->
    if buffer
      context.clearRect 0, 0, canvas.width, canvas.height
      requestAnimationFrame -> _render 0

  _render = (index)->
    length = Math.floor(buffer.length * range)
    for ch in [0...buffer.numberOfChannels] by 1
      data = buffer.getChannelData(ch)
      data = data.subarray index * renderSize, index * renderSize + renderSize
      draw data, length, ch, index
    if index * renderSize < length
      requestAnimationFrame -> _render index + 1

  draw = (data, length, ch, index)->
    width  = canvas.width
    height = canvas.height * 0.5
    cX = index * renderSize
    cY = height * 0.5 + height * ch

    context.beginPath()
    for i in [0...data.length] by 1
      x = ((i + cX) / length) * width
      y = cY - data[i] * height * zoom * 0.5
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
