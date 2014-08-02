'use strict'

class App
  generate: (buffer)->
    worker = new Worker './worker.js'
    worker.postMessage buffer, [ buffer ]
    worker.onmessage = (e)=>
      func = @[e.data.type]
      func.apply(@, e.data.args) if _.isFunction func

  info: (numFrames, @width, @height)->
    @canvas = document.createElement 'canvas'
    @canvas.width  = @width
    @canvas.height = @height

    @context = @canvas.getContext '2d'
    @image   = @context.createImageData @width, @height

    $('#result').empty().append @canvas

  progress: (data)->
    @image.data.set data
    @context.putImageData @image, 0, 0

  result: ->
    image = new Image
    image.width  = @width
    image.height = @height
    image.src = @canvas.toDataURL 'image/png'

    $('#result').empty().append image

app = new App

$ ->
  $(window).on 'dragover', (e)->
    false

  $(window).on 'drop', (e)->
    file = e.originalEvent.dataTransfer.files[0]
    if file.type is 'image/gif'
      reader = new FileReader
      reader.onload = ->
        app.generate reader.result
      reader.readAsArrayBuffer file
    false
