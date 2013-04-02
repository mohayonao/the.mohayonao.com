$ ->
  'use strict'

  class Application
    constructor: ->
      @data      = null
      @imageData = null
      @sequencer = new lelenofu.Sequencer()
      @sequencer.eof = => @pause()
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
          @imageData = lelenofu.getImageData data
          dfd.resolve @imageData
        , 200
      else
        dfd.reject()
      @prev = dfd
      dfd.promise()

    play: ->
      @isPlaying = true      
      @sequencer.play lelenofu.parse(@data)
      @onStateChange? 'play'

    pause: ->
      @isPlaying = false
      @sequencer.pause()
      @onStateChange? 'pause'

  app = new Application
  app.onStateChange = (type)->
    switch type
      when 'play'  then $('#play').css 'color', 'red'
      when 'pause' then $('#play').css 'color', 'black'

  $result = $('#result')
  
  value = if (q = location.search.substr(1, location.search.length - 1))
    decodeURIComponent q
  else ''
  
  editor = CodeMirror.fromTextArea document.getElementById('data'),
    mode:'ukulele', theme:'ukulele', value:value, workTime:200
  editor.update = ->
    app.update( editor.getValue().trim() ).then (data)->
      $result.css width:"#{data.width}px", height:"#{data.height}px"
      $result.attr 'src', lelenofu.getImageSrc data
  editor.on 'update', editor.update
  
  $('#play').on 'click', ->
    if app.isPlaying
      app.pause()
    else
      app.play()
  
  $('#tweet').on 'click', ->
    if app.data
      data = encodeURIComponent app.data      
      url = "http://#{location.host}/ukulele/"
      url = "http://the.mohayonao.com/ukulele/"
      url += "?#{data}"
      apps.tweet url:url

  editor.update()
