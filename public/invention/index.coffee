$ ->
  'use strict'

  BPM = 90
  FPS = 60

  INVENTION_13 = '''
  o3l16
  rea<c>beb<dc8e8>g+8<e8 >aea<c>beb<dc8>a8r4
  <rece>a<c>egf8a8<d8f8 fd>b<d>gbdfe8g8<c8e8
  ec>a<c>f8<d8d>bgbe8<c8 c>afad8b8<c8r8r4

  >rg<ced>g<dfe8g8>b8<g8 c>g<ced>g<dfe8c8g8e8
  <c>aeace>a<c d8f+8a8<c8 >bgdg>b<d>gb<c8e8g8b8
  af+d+f+>b<d+>f+ag8<g8gece >a+8<f+8f+d>b<d>g8<e8ec>a<c
  >f+<gf+ed+f+>b<d+e8r8r4
  rgb-gegc+egec+e>arr8 <rfafdf>b<dfd>b<d>grr8
  <regece>a<cd+c>a<c>f+rr8 <rdfd>b<d>g+b<d>bg+berr8

  rea<c>beb<dc8>a8g+8e8 a<cec>a<c>f+a<c>af+ad+<c>ba
  g+b<d>bg+bdfg+fdf>b<fed ceaece>a<cd+c>a<c>f+<c>ba
  g+8<b8g+8e8rea<c>beb<d c>a<ced>b<dfecegfedc
  >b<cdefdg+dbdcafd>b<d >g+b<c>aeabg+aece>a4<
  ;
  o2l16
  a8<a4g+8aea<c>beb<d c8>a8g+8e8aea<c>beb<d
  c8>a8<c8>a8<d>afadf>a<c >b8<d8g8b8bgegce>gb
  a8<c8df>b<d>g8b8<ce>a<c >f8d8g<gfgcg<ced>g<df

  e8c8>b8g8 <c>g<ced>g<df e8c8r4rgegce>gb
  a8<c8e8g8f+adf+>a<d>f+a g8b8<d8f+8egce>g<c>eg
  f+8a8b8<d+8rece>a<ceg f+d>b<d>gb<df+ec>a<c>f+a<c8
  c>b<c>ab8>b8<e<e>bge>bgb
  e8<e8g8b-8c+8r8r<gfe d8>d8f8a-8>b8r8r<<fed
  c8>c8e8f+8>a8r8r<<ed+c+ >b8>b8<d8f8>g+8r8r<<dc>b

  <c8>a8g+8e8aea<c>beb<d ceaece>a<c>f+a<c>af+ad+f+
  e8g+8b8g+8e8>b8g+8e8 a8<c8e8c8>a8<c8>d+8r8
  r>bg+edbgdc8e8>g+8<e8 >a8<f+8>b8<g+8c8a8d8b-8
  g+8f8d8>b8g+8a8d8e8 f8d+8e8<e8>a2
  '''


  Array::randomchoice = -> @[(Math.random() * @.length)|0]

  sinetable = new Float32Array(
    Math.sin(Math.PI * 2 * (i / 32)) for i in [0...32]
  )
  famitable = new Float32Array([
    +0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875
    +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000
    -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000
    -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125
  ])

  class DancingPortrait
    class Cell
      constructor: (@rgb, @size, @x, @y, @z=0)->

      draw: (ctx, dx, dy)->
        rate = @z * 0.2
        x = (@x + dx * rate + 0.5)|0
        y = (@y + dy * rate + 0.5)|0
        ctx.save()
        ctx.fillStyle = "rgb(#{@rgb})"
        ctx.fillRect x, y, @size, @size
        ctx.restore()

    constructor: (opts)->
      @ctx = opts.canvas.getContext '2d'
      @imgData  = getImgData opts.img
      @cellsize = opts.cellsize ? 3
      @mosaic   = getMosaic @imgData, @cellsize, @cellsize
      @tile     = opts.tile ? 4
      @cells    = []

      for y in [0...@mosaic.height] by 1
        for x in [0...@mosaic.width] by 1
          d = @mosaic.data[y][x]
          c = new Cell("#{d.R}, #{d.G}, #{d.B}", @tile, x * @tile, y * @tile)
          dx = (@mosaic.width  / 2) - x
          dy = (@mosaic.height / 4) - y
          c.z = -Math.sqrt(dx * dx + dy * dy)
          @cells.push c
      @cells.sort (a, b) -> a.z - b.z

      @anime_prev = Date.now()
      [ @x_index, @x_speed, @x_rate ] = [ 0, 0, 1.0 ]
      [ @y_index, @y_speed, @y_rate ] = [ 0, 0, 1.0 ]

    animate: ()->
      ctx = @ctx

      now = Date.now()
      elapsed = now - @anime_prev
      @anime_prev = now

      dx = @x_index
      dy = sinetable[@y_index|0] * @y_rate
      @cells.forEach (cell)->
        cell.draw(ctx, dx, dy)

      @y_index += @y_speed * elapsed
      if @y_index >= sinetable.length then @y_index -= sinetable.length

    getImgData = (img)->
      canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height

      ctx = canvas.getContext '2d'
      ctx.drawImage img, 0, 0
      ctx.getImageData 0, 0, img.width, img.height

    getMosaic = (imgData, w, h)->
      average = (x, y)->
        [R, G, B] = [0, 0, 0]
        for _y in [y...y+h] by 1
          for _x in [x...x+w] by 1
            R += imgData.data[(imgData.width * _y + _x) * 4 + 0]
            G += imgData.data[(imgData.width * _y + _x) * 4 + 1]
            B += imgData.data[(imgData.width * _y + _x) * 4 + 2]
        B:(B / (w * h))|0,  G:(G / (w * h))|0, R:(R / (w * h))|0, A:255
      cx = (imgData.width  / w) | 0
      cy = (imgData.height / h) | 0

      width:cx, height:cy, data:for y in [0...cy]
        average(x * w, y * h) for x in [0...cx]

  class ToneGenerator
    constructor: (opts)->
      freq = 440 * Math.pow(2, (opts.noteIndex - 69) * 1/12)

      @wavelet   = opts.wavelet ? sinetable
      @volume    = opts.volume  ? 0.75
      @phase     = opts.phase   ? 0
      @phaseStep = freq * @wavelet.length / pico.samplerate
      @duration  = opts.duration ? 1000
      @volumeIncr = @volume / (@duration * 0.001 * pico.samplerate)

    next: (size)->
      @volume -= @volumeIncr * size
      if @volume <= 0 then @volume = 0
      stream = new Float32Array(size)
      for i in [0...size]
        stream[i] = @wavelet[(@phase|0) % @wavelet.length] * @volume
        @phase += @phaseStep
      stream

  class MMLTrack
    constructor: (opts)->
      @originData = opts.mml
      @samplerate = pico.samplerate
      @vol = opts.vol ? 0.5
      @bpm = opts.bpm ? 120
      @shift = opts.shift
      @index = 0

      @finished = false
      @noteCounterMax = 0
      @noteCounter    = 0
      @gens = []

      @data = compile @originData

    nextTones: ->
      res = @data[@index++]
      if res? then [res] else null

    next: (size)->
      [noteCounter, noteCounterMax] = [@noteCounter, @noteCounterMax]
      [gens, vol] = [@gens, @vol]

      cell = new Float32Array(size)

      noteCounter -= size
      if noteCounter <= 0
        if (lis = @nextTones())?
          for d in lis
            if d.noteIndex != -1
              opts =
                size: size
                noteIndex: d.noteIndex + @shift
                duration: 500
                volume: d.velocity / 15
                wavelet: famitable
              g = new ToneGenerator(opts)
              gens.push g
          samples = (60 / @bpm) * @samplerate * (4 / d.length)
          noteCounter += samples
        else
          @index = 0
          noteCounter = noteCounterMax

      for gen in gens
        streamcell = gen.next size
        for j in [0...size]
          cell[j] += streamcell[j] * vol

      @gens = gens.filter (x)-> x.volume > 0
      @noteCounter = noteCounter

      cell

    compile = (data)->
      [O, L, V] = [3, 8, 12]
      TONES = c:0, d:2, e:4, f:5, g:7, a:9, b:11
      S = "-":-1, "+":+1
      r = /([cdefgabrolv<>])([-+]?)(\d*)/gm
      while (x = r.exec(data.toLowerCase()))?
        [cmd, sign, val] = x[1..3]
        t = null
        switch cmd
          when "o" then O = Number(val) if val != ""
          when "l" then L = Number(val) if val != ""
          when "v" then V = Number(val) if val != ""
          when "<" then O += 1 if O < 8
          when ">" then O -= 1 if O > 1
          when "r" then t = -1
          else t = TONES[cmd]
        switch t
          when null then continue
          when -1   then noteIndex = -1
          else noteIndex = O * 12 + t + 36 + (S[sign] ? 0)
        length = if val == "" then L else Number(val)
        noteIndex: noteIndex, length:length, velocity: V


  class MarkovMMLTrack extends MMLTrack
      constructor: (player, options={})->
          super(player, options)

          @lv    = options.lv ? 3
          @markov = {}
          @chord  = {}
          @histNoteIndex = []
          @prevNoteIndex = 0
          @index     = 0
          @readIndex = 0
          @velocity = 12

          @makeMarkovData(@lv)

      nextTones: ()->
          [noteIndexCands, noteLengthCands] = [null, null]
          [lv, histNoteIndex ] = [@lv, @histNoteIndex ]
          for i in [0...lv]
              key = histNoteIndex[i...lv].join(",")
              if (noteIndexCands = @markov[key])? then break
          if noteIndexCands?
              noteIndex = noteIndexCands.randomchoice()
          else
              noteIndex = @data[@readIndex++].noteIndex
              if @readIndex >= @data.length then @index = 0

          histNoteIndex.push noteIndex
          if histNoteIndex.length > lv then histNoteIndex.shift()
          @histNoteIndex = histNoteIndex

          if @prevNoteIndex == noteIndex
              @velocity -= 2
              if @velocity <= 0
                  @velocity = 12
                  @histNoteIndex = []
          else
              @velocity = 12
              @prevNoteIndex = noteIndex

          subNoteIndex = @chord[noteIndex]?.randomchoice() ? -1

          [ {noteIndex:noteIndex   , length:@minLength, velocity:@velocity}
            {noteIndex:subNoteIndex, length:@minLength, velocity:4        } ]


      makeMarkovData: (lv=2)->
          @minLength = @data.map((x)->x.length).reduce((a, b)->Math.max(a, b))

          data = do () =>
              [lis, prev] = [[], null]
              for d in @data
                  if d.noteIndex == -1
                      if not prev? then continue
                      noteIndex = prev
                  else noteIndex = d.noteIndex
                  for i in [0...(@minLength / d.length)]
                      lis.push noteIndex:noteIndex, length:@minLength
              lis

          make = (dst, lv)=>
              lis = []
              for d in data
                  if lis.length == lv
                      key = lis.map((x)->x.noteIndex).join(",")
                      (dst[key] ?= []).push d.noteIndex
                  lis.push d
                  if lis.length > lv then lis.shift()
          markov  = {}
          for i in [1..lv]
              make markov, i
          @markov  = markov


      makeChord: (others)->
          zip = () ->
              lengthArray = (arr.length for arr in arguments)
              length = Math.max.apply(Math, lengthArray)
              argumentLength = arguments.length
              results = []
              for i in [0...length]
                  semiResult = []
                  for arr in arguments
                      semiResult.push arr[i]
                  results.push semiResult
              results

          chord = {}
          for pair in zip(@data, others.data)
              if not pair[0]? or not pair[1]? then break
              a = pair[0].noteIndex
              b = pair[1].noteIndex
              if a != -1 and b != -1
                  b = a - ((a-b) % 12)
              (chord[a] ?= []).push b
          @chord = chord



  class SoundSystem
    constructor: ->
      @efx = new Reverb(44100, 128)

    setMML: (mml)->
      v = mml.split ';'
      t0 = new MMLTrack mml:v[0], bpm:BPM, shift:   0
      t1 = new MMLTrack mml:v[1], bpm:BPM, shift: -12

      t2 = new MarkovMMLTrack mml:v[0], bpm:BPM, shift:0
      t3 = new MarkovMMLTrack mml:v[1], bpm:BPM, shift:0
      t2.makeChord t3
      @normalTracks = [ t0, t1 ]
      @markovTrack  = [ t2 ]

    setMode: (mode)->
      switch mode
        when 'markov'
          @mmlTracks = @markovTrack
          @efx.wet = 0.75
        else
          @mmlTracks = @normalTracks
          @efx.wet = 0.25

    setEfxDepth: (depth)->
      depth = Math.max(0, Math.min(depth, 1))
      @efx.setRoomSize depth

    play : -> pico.play(@) if not pico.isPlaying
    pause: -> pico.pause() if     pico.isPlaying

    toggle: ->
      if pico.isPlaying
        pico.pause()
        false
      else
        pico.play(@)
        true

    process: (L, R)->
      mmlTracks = @mmlTracks

      for i in [0...L.length] by 1
        L[i] = R[i] = 0

      for mml in mmlTracks
        cell = mml.next L.length
        for i in [0...L.length] by 1
          L[i] = (R[i] += cell[i])

      @mmlTracks = mmlTracks.filter (x)-> not x.finished
      if @mmlTracks.length is 0
        if @readEnd then @pause()
        else @readEnd = true
      @efx.process L, R

  vue = new Vue
    el: '#app'

    data:
      mode: 'normal'

  main = (img)->
    $canvas = $(canvas = document.getElementById('canvas'))
    width  = canvas.width  = $canvas.width()
    height = canvas.height = $canvas.height()

    portrait = new DancingPortrait(img:img, canvas:canvas)
    portrait.y_speed = (sinetable.length * BPM * 2) / (60 * 1000)

    isAnimate = false
    animate = ()->
      portrait.animate()
      if isAnimate then requestAnimationFrame animate

    sys = new SoundSystem
    sys.setMML INVENTION_13

    $canvas.on 'click', (e)->
      mode = vue.mode

      sys.setMode mode
      if sys.toggle()
        $canvas.css opacity: 1.0
        if mode == 'markov'
          isAnimate = true
          requestAnimationFrame animate
      else
        $canvas.css opacity: 0.5
        isAnimate = false

    $canvas.on 'mousemove', (e)->
      offset = $canvas.offset()
      x = e.pageX - offset.left
      y = e.pageY - offset.top
      x_rate = (x / width)
      y_rate = (y / height)

      sys.setEfxDepth (1.0 - y_rate)

      portrait.y_rate  = (1.0 - y_rate) * 3.0 + 0.25
      portrait.x_index = (x_rate - 0.5) * 5

    do animate

  $('<img>').attr('src', '/invention/bach.png').load (e)->
    main e.target
