'use strict'

class FileStepLoader
  constructor: ->
    @_readBytes  = 512
    @_fetchBytes = 128
    @_buffers = []
    @_bufferReadIndex = 0
    @_file = null
    @_fileReadIndex = 0
    @_mutex = 0
    @_reset = false
    @_noneArray = new Uint8Array(@_readBytes)
    @_currentBuffer = @_noneArray

  set: (file, cb)->
    @_file = file
    @_file.slice = file.slice or file.webkitSlice or file.mozSlice
    @_mutex = 0
    @_buffers.splice 0
    @_reset = true
    @fileread =>
      @_bufferReadIndex = 0
      cb?()

  fileread: (cb)->
    unless @_mutex is 0 then return

    @_mutex = 1
    size = @_readBytes
    begin = if @_reset then 0 else @_fileReadIndex
    end   = begin + size

    blob = @_file.slice begin, end
    @_fileReadIndex = end

    reader = new FileReader
    reader.onload = (e)=>
      result = e.target.result
      buffer = new Uint8Array(size)
      for i in [0...result.length]
        buffer[i] = result.charCodeAt i
      @_buffers.push buffer
      @_mutex = 0
      cb?()
    reader.readAsBinaryString blob

    @_reset = false

  fetch: ->
    begin = @_bufferReadIndex
    end   = begin + @_fetchBytes
    @_bufferReadIndex = end

    buffer = @_currentBuffer.subarray begin, end
    if @_readBytes <= end
      @_currentBuffer = @_buffers.shift() or @_noneArray
      @_bufferReadIndex = 0
    else
      @fileread()
    buffer

class BitmapView
  constructor: (canvas, opts)->
    @_canvas  = canvas
    @width  = canvas.width  = opts.width
    @height = canvas.height = opts.height

    @_context = canvas.getContext '2d'
    @_imagedata = @_context.getImageData 0, 0, @width, @height
    for i in [0...@_imagedata.data.length] by 1
      @_imagedata.data[i] = 255

  set: (bytes)->
    data = @_imagedata.data
    widthStep = @width * 4
    for i in [0...data.length - widthStep] by 1
      data[i] = data[i + widthStep]
    j = i
    for i in [0...bytes.length] by 1
      x = bytes[i]
      switch
        when x is 0x00
          data[j++] = 0xff
          data[j++] = 0xff
          data[j++] = 0xff
        when x <= 0x1f
          data[j++] = 0x33
          data[j++] = 0xff
          data[j++] = 0xff
        when x <= 0x7f
          data[j++] = 0xff
          data[j++] = 0x33
          data[j++] = 0x33
        else
          data[j++] = 0x00
          data[j++] = 0x00
          data[j++] = 0x33
      j++
    @_context.putImageData @_imagedata, 0, 0

class SoundTrack
  constructor: ->
    @_func = (t)-> 0
    @_t = 0

  set: (bytes)->
    @_func = (t)-> bytes[t & 127]

  process: (L, R)->
    [f, t] = [@_func, @_t]
    for i in [0...L.length]
      L[i] = R[i] = ((f(t) & 0xff) * 0.0078125 - 0.5) * 0.5
      t += 0.25
    @_t = t

class App
  constructor: (elem)->
    @_stepLoader = new FileStepLoader
    @_view       = new BitmapView(elem, { width:128, height:64 })
    @_sound      = new SoundTrack
    @_amp = 1
    @_sampleCount = 0
    @_sampleCountMax = 1024 # Infinity

    @setBPM 180

  play: (file)->
    @_stepLoader.set file, =>
      @_amp = 1
      @_sampleCount = 0
      pico.play @
    $('#tips').text 'press [SPACE] to pause'

  pause: ->
    pico.pause()
    $('#tips').text 'drag a file to play'

  setBPM: (bpm)->
    @_bpm = bpm
    @_sampleCountMax = (60 / bpm) * pico.samplerate * (4/16)

  process: (L, R)->
    if @_sampleCount <= 0
      bytes = @_stepLoader.fetch()
      @_sound.set bytes
      @_view .set bytes
      @_sampleCount += @_sampleCountMax
    @_sampleCount -= 128
    @_sound.process L, R

$ ->
  $(window).on 'dragover', ->
    false

  $(window).on 'drop', (e)->
    app.play e.originalEvent.dataTransfer.files[0]
    false

  $(window).on 'keydown', (e)->
    if e.keyCode is 32
      app.pause()
      false

  app = new App(document.getElementById('screen'))
