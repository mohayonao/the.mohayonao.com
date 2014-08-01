$ ->
  'use strict'

  SAMPLERATE = 8000
  BUFFER_SIZE = 1 << 16
  BUFFER_MASK = BUFFER_SIZE - 1

  MutekiTimer.use()

  processor = new class OneLinerProcessor
    constructor: ->
      @buffer = new Uint8Array(BUFFER_SIZE)
      @rindex = @windex = @timerId = 0
      @acceptTimerId = 0

    onmessage = (e)->
      if e.data instanceof Array
        stream = e.data
        for i in [0...stream.length]
          @buffer[@windex++ & BUFFER_MASK] = stream[i]
      else switch e.data
        when 'ready'
          @ready()
        when 'error'
          @onerror?()
        when 'accept'
          @accept = true
          @onaccept?()

    play: ->
      if @timerId != 0
        clearInterval @timerId = 0
      @timerId = setInterval =>
        if @windex - 4096 < @rindex
          @worker.postMessage 0
      , 100

    pause: ->
      if @timerId != 0
        clearInterval @timerId = 0
      @timerId = 0

    fetch: ->
      @buffer[@rindex++ & BUFFER_MASK]

    next: ->
      @buffer[@rindex++ & BUFFER_MASK] / 256

    setFunction: (@func)->
      if @worker then @worker.terminate()

      @worker = new Worker('/one-liner-music/worker.js')
      @worker.onmessage = onmessage.bind @

    ready: ->
      @accept = false
      @worker.postMessage @func

      if @acceptTimerId
        clearTimeout @acceptTimerId
      @acceptTimerId = setTimeout =>
        if not @accept
          @onerror?()
      , 500

    process: (L, R)->
      for i in [0...L.length] by 1
        L[i] = R[i] = @next()

  pico.setup(samplerate:8000)

  $('#play').on 'click', ->
    if pico.isPlaying
      processor.pause()
      pico.pause()
      $(@).css color:'black'
    else
      processor.play()
      pico.play(processor)
      $(@).css color:'red'


  $func = $('#func')
  elem_map = {}
  init_history = [
    '(t>>4)&((t<<5)|(Math.sin(t)*3000))'
    't<<(t&7)|(t*(t/500)*0.25)'

    '(t&(t>>10))*(t>>11)&(15<<(t>>16))|t*(t+12)>>(t>>14)&13'

    '(t<<1)/(~t&(1<<(t&15)))'

    '(t*5&t>>7)|(t*3&t>>10)'
    't*((t>>12|t>>8)&63&t>>4)'
  ]
  history = JSON.parse(localStorage.getItem('history')) or init_history
  do ->
    list = history.slice(0)
    list.reverse()
    for h in list
      elem_map[h] = $('<li>').text(h)
      $('#history').after elem_map[h]

  commit = ->
    func = $func.css(color:'black').val()
    processor.setFunction func

  $func.on 'keyup', (e)->
    if e.keyCode is 13 then commit()
  processor.onerror = ->
    $func.css(color:'red')
  processor.onaccept = ->
    func = processor.func
    isExists = false
    for h, i in history
      if h is func
        isExists = true
        history.splice i, 1
        break
    if not isExists
      elem_map[func] = $('<li>').text(func)
    else
      elem_map[func].remove()
    $('#history').after elem_map[func]
    history.unshift func
    history = history.slice 0, 25
    localStorage.setItem 'history', JSON.stringify(history)

  $('#tweet').on 'click', ->
    url  = "http://#{location.host}/one-liner-music/"
    text = "いい曲できた"
    func = encodeURIComponent processor.func
    utils.tweet text:text, url:"#{url}?#{func}&"

  if (q = location.search.substr(1, location.search.length - 2))
    $func.val decodeURIComponent q
  else if history[0]
    $func.val history[0]

  commit()

  if utils.isPhone()
    $('#history-container').hide()
