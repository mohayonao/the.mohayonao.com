$ ->
  'use strict'

  SIZE = 400
  BLACK = '#302833'
  NAVY  = '#223a70'
  GRAY  = '#c0c6c9'

  Array::choose  = -> @[(Math.random() * @length)|0]
  Array::shuffle = ->
    a = @slice 0
    a.sort (x) -> Math.random() - 0.5
    a
  String::times = (n)-> (for i in [0...n] by 1 then @).join ''

  class Editor
    constructor: (@elem)->
      @context = @elem.getContext '2d'
      @width   = @elem.width
      @height  = @elem.height
      @halfWidth  = @width  * 0.5
      @halfHeight = @height * 0.5
      @image = null
      @mode  = 'drag'
      @position = x:0, y:0
      @zoom     = 1
      @mask     = size:10, xmax:0, ymax:0, value:1, data:new Uint8Array 0

      setEventListener.call @, @elem

    setImage: (@image)->
      @image.halfWidth  = @image.width  * 0.5
      @image.halfHeight = @image.height * 0.5
      @position = x:0, y:0
      @zoom = Math.max(@width / @image.width, @height / @image.height)
      @mask.xmax = (@width  / @mask.size)|0
      @mask.ymax = (@height / @mask.size)|0
      @mask.data = new Uint8Array @mask.xmax * @mask.ymax
      @draw()

    getImage: ->
      @image

    setMode: (value)->
      @mode = value

    getMode: ->
      @mode

    setZoom: (value)->
      zoom = Math.max(0, Math.min(value, 4))
      if @width <= @image.width * zoom and @height <= @image.height * zoom
        @zoom = zoom
        @move 0, 0

    getZoom: ->
      @zoom

    setMaskValue: (value)->
      @mask.value = value

    getMaskValue: ->
      @mask.value

    move: (dx, dy)->
      if @image
        z = 1 / @zoom
        x = @position.x + dx * z
        y = @position.y + dy * z
        hw = @image.halfWidth  - @halfWidth  * z
        hh = @image.halfHeight - @halfHeight * z
        if x < -hw then x = -hw
        if +hw < x then x = +hw
        if y < -hh then y = -hh
        if +hh < y then y = +hh
        @position.x = x
        @position.y = y
        @draw()

    paint: (_x, _y)->
      x = (_x / @mask.size)|0
      y = (_y / @mask.size)|0
      index = y * @mask.xmax + x
      if @mask.data[index] != @mask.value
        @mask.data[index] = @mask.value
        @draw()

    getImageData: ->
      if @image
        z = 1 / @zoom
        x1 = (@image.halfWidth  - @halfWidth  * z) + @position.x
        y1 = (@image.halfHeight - @halfHeight * z) + @position.y
        x2 = x1 + @width  * z
        y2 = y1 + @height * z
        [sx, sy, sw, sh] = [x1, y1, x2-x1, y2-y1]
        @context.drawImage @image, sx, sy, sw, sh, 0, 0, @width, @height
        @context.getImageData 0, 0, @width, @height

    draw: ->
      if @image
        imageData = @getImageData()
        @context.putImageData imageData, 0, 0

        for i in [0...@mask.data.length] by 1
          if @mask.data[i]
            sx = ((i % @mask.xmax)|0) * @mask.size
            sy = ((i / @mask.xmax)|0) * @mask.size
            sw = @mask.size
            sh = @mask.size
            drawmask imageData, sx, sy, sw, sh
        @context.putImageData imageData, 0, 0
        imageData

    drawmask = (imageData, sx, sy, sw, sh)->
      data = imageData.data
      for _y in [0...sh] by 1
        for _x in [0...sw] by 1
          i = ((sy + _y) * imageData.width + (sx + _x)) * 4
          data[i + 0] = 255 - data[i + 0]
          data[i + 1] = 255 - data[i + 1]
          data[i + 2] = 255 - data[i + 2]

    write: (imageData)->
      @context.putImageData imageData, 0, 0

    setEventListener = (elem)->
      $elem = $(elem)
      $elem.on 'mousedown', (e)=>
        offset = $elem.offset()
        x = e.offsetX ? (e.pageX - offset.left)
        y = e.offsetY ? (e.pageY - offset.top)
        switch @mode
          when 'mask'
            @paint x, y
        @mousedown = x:x, y:y
        e.preventDefault()
        e.stopPropagation()
        e.returnValue = false
      $elem.on 'mousemove', (e)=>
        offset = $elem.offset()
        x = e.offsetX ? (e.pageX - offset.left)
        y = e.offsetY ? (e.pageY - offset.top)
        if @mousedown
          switch @mode
            when 'trim'
              dx = @mousedown.x - x
              dy = @mousedown.y - y
              @move dx, dy
            when 'mask'
              @paint x, y
          @mousedown = x:x, y:y
      $elem.on 'mouseup', =>
        @mousedown = null
      $elem.on 'mouseout', =>
        @mousedown = null


  $msg = $('#msg')
  $btn = $('.button')
  $btn.set = (list)->
    list.forEach (items, i)->
      $($btn[i]).attr 'title', items.icon
      $($btn[i]).css 'color' , if items.enabled then BLACK else GRAY
      $btn[i].cmd = items.cmd

  class Application
    FRAMES = [2,3,4,6,8,10,12]
    SPEED  = [10,25,50,100,200,250,500,1000]

    constructor: (src, dst)->
      @editor = new Editor(src)
      @result = dst
      @prev_mode = null  
      @next_mode = null
      @frames = 6
      @speed  = 100

    setImage: (file)->
      if @editor.getMode() != 'drag'
        return false

      if file and typeof file.type is 'string' and file.type.substr(0, 5) is 'image'
        reader = new FileReader
        reader.onload = =>
          image = new Image
          image.onload = => @editor.setImage image
          image.src = reader.result
        reader.readAsDataURL file

      if file instanceof Image
        @editor.setImage file
        
      true

    getImage: ->
      @editor.getImage()

    setMode: (mode, arg)->
      @editor.setMode mode
      switch mode
        when 'drag' then drag_mode arg
        when 'trim' then trim_mode arg
        when 'mask' then mask_mode arg
        when 'conf' then conf_mode arg
        when 'exec' then exec_mode arg
        when 'save' then save_mode arg
    
    getMode: ->
      @editor.getMode()

    setZoom: (value)->
      @editor.setZoom value

    getZoom: ->
      @editor.getZoom()

    setMaskValue: (value)->
      @editor.setMaskValue value

    getMaskValue: ->
      @editor.getMaskValue()

    setConfig: (key, ch)->
      switch key
        when 'frames'
          index = (FRAMES.indexOf @frames) + ch
          if 0 <= index < FRAMES.length
            @frames = FRAMES[index]
        when 'speed'
          index = (SPEED.indexOf @speed) + ch
          if 0 <= index < SPEED.length
            @speed = SPEED[index]

    getConfig: (key)->
      switch key
        when 'frames' then @frames
        when 'speed'  then @speed

    generate: ->
      dfd = $.Deferred()

      saved = @editor.getImageData()
      mask  = app.editor.mask
      if not saved then return dfd.reject().promise()

      canvas = document.createElement 'canvas'
      canvas.width  = @editor.width
      canvas.height = @editor.height
      context = canvas.getContext '2d'

      encoder = new GIFEncoder
      encoder.setRepeat(0)
      encoder.setDelay(@speed)
      encoder.setSize(@editor.width, @editor.height)
      encoder.setQuality(1)

      processor = new MosaicProcessor saved, mask

      progress = (context, count)=>
        {width, height} = context.canvas
        imageData = context.getImageData 0, 0, width, height
        =>
          @editor.write imageData
          dfd.notify count
          
      encoder.start()
      for i in [0...@frames] by 1
        context.putImageData saved, 0, 0
        processed = processor.process context
        encoder.addFrame(processed).then progress(processed, i)
      encoder.finish()

      encoder.stream().getData().then (data)=>
        dfd.resolve data
      dfd.promise()
  
  class MosaicProcessor
    constructor: (@image, @mask)->
      @colormap = build @image, @mask

    build = (imageData, mask)->
      list = []
      for i in [0...mask.data.length] by 1
        if mask.data[i]
          sx = ((i % mask.xmax)|0) * mask.size
          sy = ((i / mask.xmax)|0) * mask.size
          sw = mask.size
          sh = mask.size
          list[i] = fetchcolor(imageData, sx, sy, sw, sh).shuffle()
      list
    
    fetchcolor = (imageData, sx, sy, sw, sh)->
      colors = {}
      data = imageData.data
      for _y in [0...sh] by 1
        for _x in [0...sw] by 1
          i = ((sy + _y) * imageData.width + (sx + _x)) * 4
          r = data[i + 0]
          g = data[i + 1]
          b = data[i + 2]
          colors[ "#{r},#{g},#{b}" ] = true
      Object.keys(colors).map (x)-> "rgb(#{x})"
    
    process: (context)->
      mask = @mask
      for i in [0...mask.data.length] by 1
        if mask.data[i]
          sx = ((i % mask.xmax)|0) * mask.size
          sy = ((i / mask.xmax)|0) * mask.size
          sw = mask.size
          sh = mask.size
          imageData = context.getImageData sx, sy, sw, sh
          context.fillStyle = @mosaic i
          context.fillRect sx, sy, sw, sh
      context

    mosaic: (index)->
      color = @colormap[index].shift()
      @colormap[index].push color
      color

  src = document.getElementById 'editor'
  dst = document.getElementById 'result'
  src.width = src.height = dst.width = dst.height = SIZE

  app = new Application(src, dst)

  # UI
  $(window).on 'dragover', (e)->
    e.preventDefault()
    e.stopPropagation()
  $(window).on 'drop', (e)->
    e.preventDefault()
    e.stopPropagation()
    if app.setImage e.originalEvent.dataTransfer.files[0]
      app.setMode 'trim'

  $btn.on 'click', -> @cmd?()
  $btn.on 'mousedown', (e)-> e.returnValue = false

  $($btn[0]).on 'click', ->
    if app.prev_mode != null
      app.setMode app.prev_mode
  $($btn[3]).on 'click', ->
    if app.next != null
      app.setMode app.next_mode

  $('#dialog .lsf-icon').on 'click', ->
    $elem = $(this)
    key = $elem.attr 'data-key'
    val = if $elem.attr('title') is 'plus' then +1 else -1
    app.setConfig key, val
    $("##{key}").text app.getConfig key

  $('#dialog .lsf-icon').on 'mousedown', (e)->
    e.returnValue = false

  drag_mode = ->
    $('#result').hide()
    $('#dialog').hide()
    $('#editor').show()          
    $msg.text '1. Drag a image'
    $btn.set [
      { icon:'back'   , enabled:false },
      { icon:'zoomout', enabled:false },
      { icon:'zoomin' , enabled:false },
      { icon:'next'   , enabled:!!app.getImage() },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = null
    app.next_mode = 'trim'

  trim_mode = ->
    $('#result').hide()
    $('#dialog').hide()
    $('#editor').show()
    app.editor.draw()
    $msg.text '2. Triming'
    $btn.set [
      { icon:'back'   , enabled:true },
      { icon:'zoomout', enabled:true, cmd:-> app.setZoom app.getZoom() / 1.2 },
      { icon:'zoomin' , enabled:true, cmd:-> app.setZoom app.getZoom() * 1.2 },
      { icon:'next'   , enabled:true },
    ]
    $(app.editor.elem).css 'cursor', 'move'
    app.prev_mode = 'drag'
    app.next_mode = 'mask'

  mask_mode = ->
    $('#result').hide()
    $('#dialog').hide()
    $('#editor').show()
    app.editor.draw()
    $msg.text '3. Masking'
    $btn.set [
      { icon:'back'  , enabled:true },
      { icon:'write' , enabled:true, cmd:->
         app.setMaskValue 1
         $($btn[1]).css 'color', NAVY
         $($btn[2]).css 'color', BLACK
      },
      { icon:'eraser', enabled:true, cmd:->
         app.setMaskValue 0
         $($btn[1]).css 'color', BLACK
         $($btn[2]).css 'color', NAVY
      },
      { icon:'next'  , enabled:true },
    ]
    $($btn[1]).click()
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'trim'
    app.next_mode = 'conf'

  conf_mode = ->
    $('#result').hide()
    $('#editor').hide()
    $('#download').hide()    
    $('#dialog').show()
    $msg.text '4. Configuration'
    $btn.set [
      { icon:'back'  , enabled:true  },
      { icon:'write' , enabled:false },
      { icon:'eraser', enabled:false },
      { icon:'next'  , enabled:true  },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'mask'
    app.next_mode = 'exec'
  
  exec_mode = ->
    P0 = '-'
    P1 = '>'
    countmax = app.frames
    $('#result').hide()
    $('#dialog').hide()
    $('#editor').show()        
    $msg.text '5. Processing: ' + P0.times(countmax)
    $btn.set [
      { icon:'back'  , enabled:false },
      { icon:'write' , enabled:false },
      { icon:'eraser', enabled:false },
      { icon:'next'  , enabled:false },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = null
    app.next_mode = null
    setTimeout ->
      app.generate().then( (data)->
        src = "data:image/gif;base64,#{btoa(data)}"
        app.setMode 'save', src
      ).progress( (count)->
        msg = '4. Processing: '
        msg += P1.times(count + 1)
        msg += P0.times(countmax - count - 1)
        $msg.text msg
      )
    , 0
  
  save_mode = (src)->
    $('#editor').hide()
    $('#dialog').hide()
    $('#result').attr(src:src).show()
    $msg.text '6. Right-Click and use "Save As"'
    $btn.set [
      { icon:'back'  , enabled:true  },
      { icon:'write' , enabled:false },
      { icon:'eraser', enabled:false },
      { icon:'next'  , enabled:false },
    ]
    if /chrome/i.test navigator.userAgent
      $('#download').attr href:src
      $('#download').show()
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'conf'
    app.next_mode = null

  app.setMode 'drag'

  image = new Image
  image.onload = ->
    app.setImage image
    app.setMode 'drag'
  image.src = '/canvas/sample01.jpg'
