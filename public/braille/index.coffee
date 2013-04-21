$ ->
  'use strict'

  SIZE = 400
  BLACK = '#302833'
  NAVY  = '#223a70'
  GRAY  = '#c0c6c9'

  class Editor
    constructor: (@elem)->
      @context = @elem.getContext '2d'
      @width   = @elem.width
      @height  = @elem.height
      @halfWidth  = @width  * 0.5
      @halfHeight = @height * 0.5
      @image = null
      @mode  = 'drag'
      @position  = x:0, y:0
      @zoom      = 1
      @threshold = 128

      setEventListener.call @, @elem

    setImage: (@image)->
      @image.halfWidth  = @image.width  * 0.5
      @image.halfHeight = @image.height * 0.5
      @position = x:0, y:0
      @zoom = Math.max(@width / @image.width, @height / @image.height)
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

    setThreshold: (threshold)->
      @threshold = threshold
      @draw()

    getThreshold: ->
      @threshold

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

    getImageData: ->
      if @image
        z = 1 / @zoom
        x1 = (@image.halfWidth  - @halfWidth  * z) + @position.x
        y1 = (@image.halfHeight - @halfHeight * z) + @position.y
        x2 = x1 + @width  * z
        y2 = y1 + @height * z
        [sx, sy, sw, sh] = [x1, y1, x2-x1, y2-y1]
        @context.drawImage @image, sx, sy, sw, sh, 0, 0, @width, @height
        imageData = @context.getImageData 0, 0, @width, @height
        
        binalize imageData, @threshold if @mode is 'thre'
        
        imageData

    draw: ->
      if @image
        imageData = @getImageData()
        @context.putImageData imageData, 0, 0
        imageData

    binalize = (imageData, threshold)->
      data = imageData.data
      for i in [0...data.length] by 4
        gray = 0.114 * data[i] + 0.587 * data[i+1] + 0.299 * data[i+2]
        data[i+0] = data[i+1] = data[i+2] = if gray < threshold then 0 else 255
      0

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
      $btn[i].cmd  = items.cmd
      $btn[i].keep = items.keep

  class Application
    constructor: (src, dst)->
      @editor = new Editor(src)
      @result = dst
      @prev_mode = null  
      @next_mode = null
      @timer = 0

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
      true

    getImage: ->
      @editor.getImage()

    setMode: (mode, arg)->
      @editor.setMode mode
      switch mode
        when 'drag' then drag_mode arg
        when 'trim' then trim_mode arg
        when 'thre' then thre_mode arg
        when 'save' then save_mode arg
    
    getMode: ->
      @editor.getMode()

    setZoom: (value)->
      @editor.setZoom value

    getZoom: ->
      @editor.getZoom()

    setThreshold: (value)->
      @editor.setThreshold value

    getThreshold: ->
      @editor.getThreshold()

    setTimer: (func)->
      @clearTimer() if @timer
      @timer = setInterval func, 50

    clearTimer: ->
      clearInterval @timer if @timer
      @timer = 0

    barilleChars = do ->
      dot = (bits)->
        bits & 7 | (bits & 112) >> 1 | (bits & 8) << 3 | bits & 128
      for i in [0..255]
        String.fromCharCode 0x2800 + dot(i)

    generate: (callback)->
      canvas = document.createElement 'canvas'
      canvas.width  = 112
      canvas.height = 112
      context = canvas.getContext '2d'

      context.drawImage @editor.elem, 0, 0, @editor.width, @editor.height, 0, 0, canvas.width, canvas.height
      data = context.getImageData(0, 0, canvas.width, canvas.height).data
      
      widthStep = canvas.width * 4

      list = []
      for y in [0...28]
        l = []
        for x in [0...56]
          index = ((y * 4 * canvas.width) + x * 2) * 4
          num = 0
          for i in [0...8]
            num += Math.pow(2, i) if 192 > data[index + (i%4) * widthStep + (i/4)|0]
          l.push barilleChars[num]
        list.push l.join ''
        0

      callback list.join '\n'
      

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
  $btn.on 'mousedown', (e)->
    if @keep
      app.setTimer => @cmd?()
    e.returnValue = false

  $btn.on 'mouseup', (e)->
    app.clearTimer()
    e.returnValue = false

  $($btn[0]).on 'click', ->
    if app.prev_mode != null
      app.setMode app.prev_mode
  $($btn[3]).on 'click', ->
    if app.next != null
      app.setMode app.next_mode

  drag_mode = ->
    $('#result').hide()
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
    app.next_mode = 'thre'

  thre_mode = ->
    $('#result').hide()
    $('#editor').show()
    app.editor.draw()
    $msg.text '3. Threshold'
    $btn.set [
      { icon:'back'  , enabled:true },
      { icon:'up'    , enabled:true, keep:true, cmd:->
        app.setThreshold Math.min(255, app.getThreshold() + 2)
      },
      { icon:'down', enabled:true, keep:true, cmd:->
        app.setThreshold Math.max(  0, app.getThreshold() - 2)
      },
      { icon:'next'  , enabled:true },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'trim'
    app.next_mode = 'save'
  
  save_mode = (src)->
    $('#editor').hide()
    $('#result').attr(src:src).show()
    $msg.text '6. Copy and Paste'
    $btn.set [
      { icon:'back'  , enabled:true  },
      { icon:'up'    , enabled:false },
      { icon:'down'  , enabled:false },
      { icon:'next'  , enabled:false },
    ]
    $(app.editor.elem).css 'cursor', 'default'
    app.prev_mode = 'thre'
    app.next_mode = null
    setTimeout ->
      app.generate (text)->
        $('#result').text text
    , 0

  app.setMode 'drag'
