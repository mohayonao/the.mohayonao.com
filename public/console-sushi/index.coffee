$ ->
  'use strict'
    
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

  class SushiText
    constructor: (@num, @width=29, @height=24)->
            
    load: ->
      dfd = $.Deferred()
      new ImageLoader().load(@num).then (img)=>
        canvas = document.createElement 'canvas'
        canvas.width  = @width
        canvas.height = @height
        context = canvas.getContext '2d'
        context.fillStyle = 'white'
        context.fillRect 0, 0, canvas.width, canvas.height
        context.drawImage img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height
        data = context.getImageData(0, 0, canvas.width, canvas.height).data
        
        colors = for i in [0...data.length-4] by 4
          a  = data[i+4] / 255
          r = ((data[i+0] * a) + (255 * (1-a)))|0
          g = ((data[i+1] * a) + (255 * (1-a)))|0
          b = ((data[i+2] * a) + (255 * (1-a)))|0
          r = ('00'+r.toString(16)).substr -2
          g = ('00'+g.toString(16)).substr -2
          b = ('00'+b.toString(16)).substr -2
          "color:##{r}#{g}#{b}"
        
        data = for i in [0...@height]
          colors.splice 0, @width
        dfd.resolve data
        
      dfd.promise()

  class SushiLane
    constructor: (@width=128, @height=24)->
      @text = ('%c\u2588' for i in [0...@width]).join ''
      @pad  = ('color:#ffffff'  for i in [0...@width])
      @data = ([] for i in [0...@height])
    
    put: (data)->
      for i in [0...@height]
        @data[i] = @data[i].concat data[i]
      0

    draw: ->
      console.clear()
      for i in [0...@data.length] by 1
        data = (@data[i].concat @pad).slice 0, @width
        console.log.apply console, [@text].concat data
        @data[i].shift()
        @data[i].push 'color:#ffffff'
      0

  width = ((window.innerWidth - 120) / 8)|0
  lane = new SushiLane width
  
  setInterval ->
    lane.draw()
  , 500

  $('button', '#container').on 'click', ->
    num = ($(this).attr 'data-num')|0
    new SushiText(num).load().then (data)-> lane.put data
