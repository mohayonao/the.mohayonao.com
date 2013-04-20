'use strict'

$ ->
  mirror = (imageData)->
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

  class DetectProcessor
    constructor: ->
      @canvas = document.createElement 'canvas'
      @width  = @canvas.width  = 160
      @height = @canvas.height = 120
      @context = @canvas.getContext '2d'

    process: (src)->
      @context.drawImage src, 0, 0, src.width, src.height, 0, 0, @width, @height

      detector = ccv.detect_objects
        canvas : @canvas
        cascade: cascade
        interval: 5
        min_neighbors: 1

      @detect = detector.shift()

    _onmessage = (e)->
      switch e.data.type
        when 'console'
          console.log.apply console, e.data.data
        when 'return'
          dfd = @pool[e.data.index]
          if dfd then dfd.resolve e.data.data
          delete @pool[e.data.index]

     _send = (type)->
      index = @index++
      data = slice.call arguments, 1
      if data.length <= 1
        data = data[0]
      dfd = @pool[index] = new $.Deferred
      @worker.postMessage type:type, index:index, data:data
      dfd.promise()


  class ImageProcessor
    constructor: (@func)->
      @detector = new DetectProcessor
      @canvas   = document.createElement 'canvas'
      @width    = @canvas.width  = 320
      @height   = @canvas.height = 240
      @context  = @canvas.getContext '2d'

    process: (src, dst)->
      @detector.process src

      @context.drawImage src, 0, 0, src.width, src.height, 0, 0, @width, @height

      imageData = @context.getImageData 0, 0, @width, @height

      @func? imageData

      context = dst.getContext '2d'
      context.putImageData imageData, 0, 0

      scale = @width / @detector.width

      if (detect = @detector.detect)
        x = @width - (detect.x + detect.width) * scale
        y = detect.y * scale
        w = detect.width  * scale
        h = detect.height * scale
        context.fillStyle   = 'rgba(255,255,255,0.25)'
        context.fillRect x, y, w, h

  video  = document.getElementById 'cam'
  canvas = document.getElementById 'canvas'
  processor = new ImageProcessor mirror

  onsuccess = (stream)->
    video.src = window.webkitURL.createObjectURL stream
    apps.animate fps:5, ->
      processor.process video, canvas
      true

  onerror = (error)->
    console.log error

  navigator.webkitGetUserMedia {audio:false, video:true}, onsuccess, onerror
