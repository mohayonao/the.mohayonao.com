$ ->
  'use strict'

  class ImageLoader
    map = {}
    constructor: (@src)->
      if not map[@src]
        @dfd = new $.Deferred
        map[@src] = @
      return map[@src]
    
    load: ->
      img = new Image
      img.src = @src
      img.onload = =>
        @dfd.resolve img
      @load = =>
        do @dfd.promise
      do @load
  
  class SushiText
    constructor: (@num, @width=35, @height=20)->
            
    load: ->
      dfd = $.Deferred()
      src = "/lib/img/sushi/#{('000'+@num).substr(-3)}.png"
      new ImageLoader(src).load().then (img)=>
        canvas = document.createElement 'canvas'
        canvas.width  = @width
        canvas.height = @height
        context = canvas.getContext '2d'
        context.fillStyle = 'white'
        context.fillRect 0, 0, canvas.width, canvas.height
        context.drawImage img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height
        data = context.getImageData(0, 0, canvas.width, canvas.height).data
        
        colors = for i in [0...data.length-4] by 4
          (data[i] << 16) + (data[i+1] << 8) + data[i+2]
        
        data = for i in [0...@height]
          colors.splice 0, @width
        dfd.resolve data
        
      dfd.promise()

  class SushiLane
    constructor: (@width=128, @height=20)->
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
            css.push data[j]
          val.push '\u2588'
        if css[css.length-1] is 0xffffff
          val.splice val.lastIndexOf '%c'
          css.pop()
        val.push "%c#{i}"
        css.push 0xffffff
        data.splice 0, 3
        [val.join ''].concat css.map (x) -> "color:##{('000000'+x.toString(16)).substr -6}"
      console.clear()
      for items in list
        console.log.apply console, items
      0

  width = ((window.innerWidth - 90) / 8)|0
  lane = new SushiLane width
  
  setInterval ->
    lane.draw()
  , 750

  $('button', '#container').on 'click', ->
    num = ($(this).attr 'data-num')|0
    new SushiText(num).load().then (data)-> lane.put data
