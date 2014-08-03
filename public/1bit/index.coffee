'use strict'

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
    @target  = null
    @animate = null
    @width  = @canvas.width  = $(@canvas).width()
    @height = @canvas.height = $(@canvas).height()
    @context = @canvas.getContext '2d'
    @context.font = '12px monospace'
    @context.fillStyle   = '#ffffff'
    @context.strokeStyle = '#2980b9'

  play: ->
    @animate = animate.bind @
    requestAnimationFrame @animate

  pause: ->
    @animate = null

  animate =->
    unless @target  then return
    unless @animate then return

    @context.fillRect 0, 0, @width, @height

    text = (@target[i] for i in [0...@target.length] by 1).join ' '

    @context.strokeText text, 0, 12, @width

    requestAnimationFrame @animate

$ ->
  vue = new Vue
    el: '#app'

    data:
      mml: ''
      sampleRate: 44100
      isPlaying: false

    methods:
      play: ->
        @isPlaying = not @isPlaying
        if @isPlaying
          sequencer = new MMLSequencer(@mml)
          pico.play sequencer
          viewer.target = sequencer.cell
          viewer.play()
        else
          pico.pause()
          viewer.pause()

      select: (id)->
        $.get("./#{id}.mml").then (data)=>
          @mml = data

  if pico.env is 'nop' then return

  viewer = new WaveViewer()

  vue.mml = '''
  t150 l16 @w40 o6 /:16 crcrcrrc rcrrcrcr > brbrbrrb rbrrbrbr < :/;
  t150 l16 @w40 o5 /:16 frfrfrdf rfrdfdfr   erererce rercecer   :/
  '''
