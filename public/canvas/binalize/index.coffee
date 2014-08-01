$ ->
  'use strict'

  threshold = 64

  func = (imageData)->
    data = imageData.data
    for i in [0...data.length] by 4
      gray = 0.114 * data[i] + 0.587 * data[i+1] + 0.299 * data[i+2]
      data[i+0] = data[i+1] = data[i+2] = if gray < threshold then 0 else 255
    0

  class ImageProcessor
    constructor: (@func)->
      @canvas = document.createElement 'canvas'
      @width  = @canvas.width  = 256
      @height = @canvas.height = 256
      @context = @canvas.getContext '2d'

    setSize: (width, height)->
      @width  = @canvas.width  = width
      @height = @canvas.height = height

    process: (src, dst)->
      context = dst.getContext '2d'
      @context.drawImage src, 0, 0, src.width, src.height

      imageData = @context.getImageData 0, 0, @width, @height

      @func? imageData

      context.putImageData imageData, 0, 0

  video  = document.getElementById 'cam'
  canvas = document.getElementById 'canvas'
  processor = new ImageProcessor func

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
