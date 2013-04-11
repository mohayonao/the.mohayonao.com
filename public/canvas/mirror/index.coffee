$ ->
  'use strict'

  func = (imageData)->
    data = imageData.data
    width  = imageData.width
    height = imageData.height
    for y in [0...height] by 1
      for x in [0...width>>1] by 1
        i = ((y + 0) * width + x    ) * 4
        j = ((y + 1) * width - x - 1) * 4
        [ data[i+0], data[j+0] ] = [ data[j+0], data[i+0] ]
        [ data[i+1], data[j+1] ] = [ data[j+1], data[i+1] ]
        [ data[i+2], data[j+2] ] = [ data[j+2], data[i+2] ]
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

  animate = (now)->
    processor.process video, canvas
    requestAnimationFrame animate

  video  = document.getElementById 'cam'
  canvas = document.getElementById 'canvas'
  processor = new ImageProcessor func
  
  image = document.getElementById('src')
  $(image).on 'load', ->
    processor.setSize @width, @height
    processor.process @, canvas
  
  onsuccess = (stream)->
    video.src = window.webkitURL.createObjectURL stream
    requestAnimationFrame animate    

  onerror = (error)->
    console.log error

  navigator.webkitGetUserMedia {audio:false, video:true}, onsuccess, onerror
