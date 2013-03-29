$ ->
  'use strict'

  SIZE = 400
  BLACK = '#302833'
  NAVY  = '#223a70'
  GRAY  = '#c0c6c9'

  Array::choose = -> @[(Math.random() * @length)|0]
  String::times = (n)-> (for i in [0...n] then @).join ''

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
      @context.save()
      if @image
        imageData = @getImageData()
        @context.putImageData imageData, 0, 0
      else
        imageData = null
      @context.fillStyle = '#000'
      for i in [0...@mask.data.length]
        if @mask.data[i]
          x = ((i % @mask.xmax)|0) * @mask.size
          y = ((i / @mask.xmax)|0) * @mask.size
          @context.fillRect x, y, @mask.size, @mask.size
      @context.restore()
      imageData

    write: (imageData)->
      @context.putImageData imageData, 0, 0

    setEventListener = (elem)->
      $elem = $(elem)
      $elem.on 'mousedown', (e)=>
        [x, y] = [e.offsetX, e.offsetY]
        switch @mode
          when 'mask'
            @paint x, y
        @mousedown = x:x, y:y
        e.preventDefault()
        e.stopPropagation()
      $elem.on 'mousemove', (e)=>
        [x, y] = [e.offsetX, e.offsetY]
        if @mousedown
          switch @mode
            when 'trim'
              dx = @mousedown.x - x
              dy = @mousedown.y - y
              @move dx, dy
            when 'mask'
              @paint x, y
          @mousedown = x:e.offsetX, y:e.offsetY
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
    FRAMES = [2..16]
    SPEED  = [10,20,30,40,50,75,100,150,200,250,300,400,500,600,700,800,900,1000]
    
    constructor: (src, dst)->
      @editor = new Editor(src)
      @result = dst
      @prev_mode = null  
      @next_mode = null
      @frames = 8
      @speed  = 100

    setImage: (file)->
      if file and typeof file.type is 'string' and file.type.substr(0, 5) is 'image'
        reader = new FileReader
        reader.onload = =>
          image = new Image
          image.onload = => @editor.setImage image
          image.src = reader.result
        reader.readAsDataURL file
      true

    getImage: ->
      @editor.getImage()

    setMode: (value)->
      @editor.setMode value      
      switch value
        when 'drag' then do drag_mode
        when 'trim' then do trim_mode
        when 'mask' then do mask_mode
        when 'conf' then do conf_mode
        when 'exec' then do exec_mode
        when 'save' then do save_mode
    
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

      progress = (context, count)=>
        {width, height} = context.canvas
        imageData = context.getImageData 0, 0, width, height
        =>
          @editor.write imageData
          dfd.notify count
          
      encoder.start()
      for i in [0...@frames]
        context.putImageData saved, 0, 0
        processed = @_process context, mask
        encoder.addFrame(processed).then progress(processed, i)
      encoder.finish()

      encoder.stream().getData().then (data)=>
        dfd.resolve data
      dfd.promise()

    _process: (context, mask)->
      for i in [0...mask.data.length]
        if mask.data[i]
          sx = ((i % mask.xmax)|0) * mask.size
          sy = ((i / mask.xmax)|0) * mask.size
          sw = mask.size
          sh = mask.size
          imageData = context.getImageData sx, sy, sw, sh
          context.fillStyle = mosaic imageData, sw, sh
          context.fillRect sx, sy, sw, sh
      context

    mosaic = (imageData, w, h)->
      colors = []
      for y in [0...h]
        for x in [0...w]
          colors.push [
            imageData.data[(y + x) * 4 + 0]
            imageData.data[(y + x) * 4 + 1]
            imageData.data[(y + x) * 4 + 2]
          ]
      "rgb(#{colors.choose().join(',')})"


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
    app.generate().then( (data)->
      src = "data:image/gif;base64,#{btoa(data)}"
      $('#editor').hide()
      $('#dialog').hide()
      $('#result').attr(src:src).show()
      app.setMode 'save'
    ).progress( (count)->
      msg = '4. Processing: '
      msg += P1.times(count + 1)
      msg += P0.times(countmax - count - 1)
      $msg.text msg
    )

  save_mode = ->
    $msg.text '6. Right-Click and use "Save As"'
    $btn.set [
      { icon:'back'  , enabled:true  },
      { icon:'write' , enabled:false },
      { icon:'eraser', enabled:false },
      { icon:'next'  , enabled:false },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'conf'
    app.next_mode = 'drag'

  app.setMode 'drag'
