$ ->
  'use strict'
  
  if pico.env is 'nop' then return
  
  class Pulse
    constructor: ->
      @cell = new Float32Array(pico.cellsize)
      @width = 0.5
      @phase = 0
      @phaseStep = 0

    setFreq: (val)->
      @phaseStep = val / pico.samplerate

    setWidth: (val)->
      @width = val * 0.01

    process: ->
      cell = @cell
      phaseStep = @phaseStep
      width = @width
      phase = @phase
      for i in [0...cell.length] by 1
        cell[i] = (phase < width)|0
        phase += phaseStep
        phase -= 1 while phase >= 1
      @phase = phase
      cell

  class Envelope
    constructor: ->
      @samples = 0
      @amp = true

    setTime: (val, @amp)->
      @samples = (val * pico.samplerate * 0.001)|0

    process: (cell)->
      samples = @samples
      if @amp then for i in [0...cell.length]
        cell[i] *= (samples-- > 0)|0
      else for i in [0...cell.length]
        cell[i] = 0
      @samples = samples
      cell

  class MMLTrack
    constructor: (mml)->
      @samplerate = pico.samplerate
      @t = 120
      @l = 4
      @o = 5
      @segnoIndex = null

      @index    = -1
      @samples  = 0
      @loopStack = []
      @commands  = @compile mml
      @pulse = new Pulse()
      @env   = new Envelope()

    compile: (mml)->
      commands = []
      checked  = new Array(mml.length)
      for def in MMLCommands
        re = def.re
        while m = re.exec mml
          if not checked[m.index]
            checked[m.index+i] = true for i in [0...m[0].length]
            cmd = def.func m
            cmd.index = m.index
            cmd.origin = m[0]
            commands.push cmd
      commands.sort (a, b)-> a.index - b.index
      commands

    doCommand: (cmd)->
      if cmd is undefined
        if @segnoIndex != null
          @index = @segnoIndex
        else
          @samples = Infinity
          @isEnded = true
      else switch cmd.name
        when '@w' then @pulse.setWidth cmd.val
        when 't' then @t = cmd.val
        when 'l' then @l = cmd.val
        when 'o' then @o = cmd.val
        when '<' then @o += 1
        when '>' then @o -= 1
        when '$' then @segnoIndex = @index
        when '/:'
              @loopStack.push index:@index, count:cmd.val or 2, exit:0
        when ':/'
          peek = @loopStack[@loopStack.length-1]
          peek.exit = @index
          peek.count -= 1
          if peek.count <= 0
            @loopStack.pop()
          else
            @index = peek.index
        when '/'
          peek = @loopStack[@loopStack.length-1]
          if peek.count is 1
            @loopStack.pop()
            @index = peek.exit
        when 'note', 'rest'
          len = cmd.len or @l
          sec = (60 / @t) * (4 / len)
          @samples += (sec * pico.samplerate)|0
          @samples *= [1,1.5,1.75][cmd.dot] or 1
          freq = if cmd.name is 'rest' then 0 else
            440 * Math.pow(Math.pow(2, 1/12), cmd.tone + @o * 12 - 69)
          @pulse.setFreq freq
          @env.setTime sec * 800, !!freq

    process: ->
      while @samples <= 0
        @doCommand @commands[++@index]
      @samples -= pico.cellsize
      if @samples != Infinity
        cell = @pulse.process()
        @env.process cell

    MMLCommands = [
      { re:/@w(\d*)/g, func:(m)->
        name:'@w',val:m[1]|0
      }
      { re:/t(\d*)/g, func:(m)->
        name:'t', val:m[1]|0
      }
      { re:/l(\d*)/g, func:(m)->
        name:'l', val:m[1]|0
      }
      { re:/o(\d*)/g, func:(m)->
        name:'o', val:m[1]|0
      }
      { re:/[<>]/g, func:(m)->
        name:m[0]
      }
      { re:/\/:(\d*)/g, func:(m)->
        name:'/:', val:m[1]|0
      }
      { re:/:\//g, func:(m)->
        name:':/'
      }
      { re:/\//g, func:(m)->
        name:'/'
      }
      { re:/\$/g, func:(m)->
        name:'$'
      }
      { re:/([cdefgab])([-+]?)(\d*)(\.*)/g, func:(m)->
        name:'note', len:m[3]|0, dot:m[4].length,
        tone:{c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1]] + ({'-':-1,'+':+1}[m[2]]|0)
      }
      { re:/r(\d*)(\.*)/g, func:(m)->
        name:'rest', len:m[1]|0, dot:m[2].length
      }
    ]

  class MMLSequencer
    constructor: (mml)->
      @tracks = for mml in mml.split(';').filter((x)->x)
        new MMLTrack(mml)
      @cell   = new Float32Array(pico.cellsize)
      @index  = 0

    process: (L, R)->
      cell = @cell
      step = @tracks.length
      index = @index
      for track, j in @tracks
        tmp = track.process()
        if tmp then for i in [(index + j) % step...cell.length] by step
          cell[i] = tmp[i]
      @index += step
      for i in [0...cell.length] by 1
        L[i] = R[i] = cell[i] * 0.25
      0

  class WaveViewer
    constructor: ->
      @canvas = document.getElementById 'canvas'
      @context = @canvas.getContext '2d'
      @target  = null
      @animate = null
      @width  = @canvas.width  = 512
      @height = @canvas.height =  40
      @context.fillStyle = 'rgba(255, 255, 255, 0.8)'
      @context.strokeStyle = '#007bbb'

    play: ->
      @animate = animate.bind @
      requestAnimationFrame @animate

    pause: ->
      @animate = null

    animate =->
      unless @target  then return
      unless @animate then return

      context = @context
      context.fillRect 0, 0, @width, @height

      target = @target

      x  = 0
      y  = target[0] * 24 + 8
      dx = @width / target.length

      context.beginPath()
      context.moveTo x, y

      for i in [1...target.length] by 1
        x += dx
        context.lineTo x, y
        y = target[i] * 24 + 8
        context.lineTo x, y
      context.lineTo @width, y
      context.stroke()

      requestAnimationFrame @animate

  viewer = new WaveViewer()

  $('#play').on 'click', ->
    if pico.isPlaying
      pico.pause()
      viewer.pause()
      $(@).css color:'black'
    else
      samplerate = $('#samplerate').val()|0
      if samplerate is 0 then samplerate = pico.samplerate
      pico.setup(samplerate:samplerate)
      gen = new MMLSequencer($('#mml').val().trim())
      pico.play(gen)
      viewer.target = gen.cell
      viewer.play()
      $(@).css color:'red'

  $('#samplerate option').each (i, e)->
    e = $(e)
    if (e.val()|0) > pico.samplerate
      e.attr 'disabled', true
    else not e.attr 'selected', true

  $('#mml-list a').each (i, e)->
    $(e).on 'click', ->
      $('#mml').val $("#data-#{i}").val().trim()
    if i is 0 then $(e).click()

  if apps.isPhone
    $('#samplerate-container').css(float:'right')
    $('#mml').hide()
