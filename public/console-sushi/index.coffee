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
          r = ('00'+data[i+0].toString(16)).substr -2
          g = ('00'+data[i+1].toString(16)).substr -2
          b = ('00'+data[i+2].toString(16)).substr -2
          "##{r}#{g}#{b}"
        
        data = for i in [0...@height]
          colors.splice 0, @width
        dfd.resolve data
        
      dfd.promise()

  class SushiLane
    constructor: (@width=128, @height=24)->
      @data = ([] for i in [0...@height])
    
    put: (data)->
      for i in [0...@height]
        @data[i] = @data[i].concat data[i]
      0

    draw: ->
      list = for data, i in @data
        val = []
        css = []
        for j in [0...Math.min(data.length, @width)] by 1
          if data[j] != data[j-1]
            val.push '%c'
            css.push "color:#{data[j]}"
          val.push '\u2588'
        if css[css.length-1] is 'color:#ffffff'
          val.splice val.lastIndexOf '%c'
          css.pop()
        val.push "%c#{i}"
        css.push 'color:#ffffff'
        data.splice 0, 3
        [val.join ''].concat css
      console.clear()
      for items in list
        console.log.apply console, items
      0

  width = ((window.innerWidth - 120) / 8)|0
  lane = new SushiLane width
  
  setInterval ->
    lane.draw()
  , 750

  $('button', '#container').on 'click', ->
    num = ($(this).attr 'data-num')|0
    new SushiText(num).load().then (data)-> lane.put data
