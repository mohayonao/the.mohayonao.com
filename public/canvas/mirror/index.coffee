$ ->
  'use strict'

  class ImageProcessor
    constructor: ->
      @canvas = document.createElement 'canvas'
      @width  = @canvas.width  = 256
      @height = @canvas.height = 256
      @context = @canvas.getContext '2d'
      @mirror = false

    setSize: (width, height)->
      @width  = @canvas.width  = width
      @height = @canvas.height = height

    process: (src, dst)->
      context = dst.getContext '2d'

      if not @mirror
        @context.translate src.width, 0
        @context.scale -1, 1
        @mirror = true
      @context.drawImage src, 0, 0, src.width, src.height

      imageData = @context.getImageData 0, 0, @width, @height

      context.putImageData imageData, 0, 0

  video  = document.getElementById 'cam'
  canvas = document.getElementById 'canvas'
  processor = new ImageProcessor

  image = document.getElementById('src')
  $(image).on 'load', ->
    processor.setSize @width, @height
    processor.process @, canvas

  onsuccess = (stream)->
    video.src = createObjectURL stream
    utils.animate ->
      processor.process video, canvas

  onerror = (error)->
    console.log error

  navigator.webkitGetUserMedia {audio:false, video:true}, onsuccess, onerror
