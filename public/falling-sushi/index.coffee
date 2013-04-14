$ ->
  'use strict'
  
  OBJECT_NUM = 200
  IMAGE_NUM  =  75
  SUSHI_SIZE =  20
  
  class ImageLoader
    map = {}
    
    constructor: ->
      @dfd = $.Deferred()
    
    load: (@num)->
      if not map[@num]
        map[@num] = @
      map[@num]._load()
    
    _load: ->
      img = new Image
      img.src = "/lib/img/sushi/#{('000'+@num).substr(-3)}.png"
      img.onload = =>
        @dfd.resolve img
      @_load = =>
        @dfd.promise()
      @dfd.promise()

  class Sushi
    constructor: (@num, @x, @y, @z)->
      new ImageLoader().load(@num).then (img)=>
        @img = img

    draw: (context)->
      if not @img
        return
      size = @z * SUSHI_SIZE
      x = @x - size * 0.5
      y = @y - size * 0.5
      context.drawImage @img, 0, 0, @img.width, @img.height, x, y, size, size

  rand = (min, max)->
    if not max?
      [min, max] = [0, min]
    Math.random() * (max - min) + min
      
  canvas = document.getElementById 'canvas'
  canvas.width  = $(canvas).width()
  canvas.height = $(canvas).height()
  context = canvas.getContext '2d'
  
  objects = for i in [0...OBJECT_NUM] by 1
    new Sushi(
      rand(IMAGE_NUM)|0,
      rand(canvas.width),
      rand(-canvas.height, canvas.height),
      rand(0.25, 3.00)
    )
  objects.sort (a, b)-> a.z - b.z

  apps.animate fps:40, (now, dt)->
    context.clearRect 0, 0, canvas.width, canvas.height
    for i in [0...OBJECT_NUM] by 1
      o = objects[i]
      o.x += rand(-1, 1)
      o.y += o.z * dt * 0.1
      o.draw context
      
      if o.y > canvas.height + SUSHI_SIZE * 5
        objects[i] = new Sushi(
          rand(IMAGE_NUM)|0,
          rand(canvas.width),
          SUSHI_SIZE * -5,
          o.z
        )
