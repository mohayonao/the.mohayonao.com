$ ->
  'use strict'

  class Application
    constructor: ->
      @data      = null
      @imageData = null
      @sequencer = new ukulele.Sequencer()
      @sequencer.emit = => @pause()
      @isPlaying = false
      @timerId = 0
      @prev = null

    update: (data)->
      dfd = $.Deferred()
      data = data.trim()
      if @prev
        @prev.reject()
      if data != @data
        if @timerId
          clearTimeout @timerId
        @timerId = setTimeout =>
          @data      = data
          @imageData = ukulele.getImageData data
          dfd.resolve @imageData
        , 200
      else
        dfd.reject()
      @prev = dfd
      dfd.promise()

    play: ->
      @isPlaying = true      
      @sequencer.play @data
      @onStateChange? 'play'

    pause: ->
      @isPlaying = false
      @sequencer.pause()
      @onStateChange? 'pause'

  app = new Application
  app.onStateChange = (type)->
    switch type
      when 'play'  then $('#play').addClass 'btn-active'
      when 'pause' then $('#play').removeClass 'btn-active'

  $result = $('#result')
  
  editor = CodeMirror.fromTextArea document.getElementById('data'),
    mode:'ukulele', theme:'ukulele', workTime:200

  value = if (q = location.hash.substr(1, location.hash.length - 1))
    decodeURIComponent q
  else ''
  editor.setValue value
      
  editor.update = ->
    app.update( editor.getValue().trim() ).then (data)->
      $result.css width:"#{data.width}px", height:"#{data.height}px"
      $result.attr 'src', ukulele.getImageSrc data
  editor.on 'update', editor.update
  
  $('#play').on 'click', ->
    if app.isPlaying
      app.pause()
    else
      app.play()
  
  $('#tweet').on 'click', ->
    if app.data
      data = encodeURIComponent app.data      
      url = "http://#{location.host}/ukulele/##{data}"
      apps.tweet url:url

  do ->
    $demo = $('#demo')
    demo.forEach (value, i)->
      $option = $('<option>').text("demo 0#{i+1}").appendTo $demo
    $demo.on 'change', ->
      editor.setValue demo[@selectedIndex]
      editor.update()
    if value is ''
      $demo.change()

  editor.update()
