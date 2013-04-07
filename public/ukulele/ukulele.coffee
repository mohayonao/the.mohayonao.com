'use strict'

exports = {}

CHORDS =
  'C':'3000', 'Cm':'3330', 'C7':'1000', 'CM7':'2000', 'Cm7':'3333',
  'Cdim':'3232', 'Cm7(b5)':'3233', 'Caug':'3001', 'Csus4':'3355',
  'C6':'0000', 'C7(9)':'1020', 'CM7(9)':'2020', 'CmM7':'3334', 'Cadd9':'3020'

  'C#':'4111', 'C#m':'4441', 'C#7':'2111', 'C#M7':'3111', 'C#m7':'2011',
  'C#dim':'1010', 'C#m7(b5)':'3233', 'C#aug':'0112', 'C#sus4':'2211',
  'C#6':'1111', 'C#7(9)':'2131', 'C#M7(9)':'3131', 'C#mM7':'3011', 'C#add9':'4131'

  'Db':'4111', 'Dbm':'4441', 'Db7':'2111', 'DbM7':'3111', 'Dbm7':'2011',
  'Dbdim':'1010', 'Dbm7(b5)':'3233', 'Dbaug':'0112', 'Dbsus4':'2211',
  'Db6':'1111', 'Db7(9)':'2131', 'DbM7(9)':'3131', 'DbmM7':'3011', 'Dbadd9':'4131'

  'D':'0222', 'Dm':'0122', 'D7':'3222', 'DM7':'4222', 'Dm7':'3122',
  'Ddim':'2121', 'Dm7(b5)':'3121', 'Daug':'1223', 'Dsus4':'0322',
  'D6':'2222', 'D7(9)':'3242', 'DM7(9)':'4242', 'DmM7':'4122', 'Dadd9':'5242'

  'D#':'1330', 'D#m':'1233', 'D#7':'4333', 'D#M7':'5333', 'D#m7':'4233',
  'D#dim':'3232', 'D#m7(b5)':'4232', 'D#aug':'2330', 'D#sus4':'1433',
  'D#6':'4444', 'D#7(9)':'1110', 'D#M7(9)':'1120', 'D#mM7':'5233', 'D#add9':'1130'

  'Eb':'1330', 'Ebm':'1233', 'Eb7':'4333', 'EbM7':'5333', 'Ebm7':'4233',
  'Ebdim':'3232', 'Ebm7(b5)':'4232', 'Ebaug':'2330', 'Ebsus4':'1433',
  'Eb6':'4444', 'Eb7(9)':'1110', 'EbM7(9)':'1120', 'EbmM7':'5233', 'Ebadd9':'1130'

  'E':'2444', 'Em':'2344', 'E7':'2021', 'EM7':'2031', 'Em7':'2020',
  'Edim':'1010', 'Em7(b5)':'4232', 'Eaug':'3001', 'Esus4':'2544',
  'E6':'2011', 'E7(9)':'2221', 'EM7(9)':'2231', 'EmM7':'2030', 'Eadd9':'2241'

  'F':'0102', 'Fm':'3101', 'F7':'3132', 'FM7':'0055', 'Fm7':'3131',
  'Fdim':'2121', 'Fm7(b5)':'2131', 'Faug':'0112', 'Fsus4':'1103',
  'F6':'3122', 'F7(9)':'3332', 'FM7(9)':'0000', 'FmM7':'3141', 'Fadd9':'0100'

  'F#':'1213', 'F#m':'0212', 'F#7':'4243', 'F#M7':'4253', 'F#m7':'4242',
  'F#dim':'3232', 'F#m7(b5)':'3242', 'F#aug':'1223', 'F#sus4':'4244',
  'F#6':'4233', 'F#7(9)':'4443', 'F#M7(9)':'1111', 'F#mM7':'4252', 'F#add9':'1211'

  'Gb':'1213', 'Gbm':'0212', 'Gb7':'4243', 'GbM7':'4253', 'Gbm7':'4242',
  'Gbdim':'3232', 'Gbm7(b5)':'3242', 'Gbaug':'1223', 'Gbsus4':'4244',
  'Gb6':'4233', 'Gb7(9)':'4443', 'GbM7(9)':'1111', 'GbmM7':'4252', 'Gbadd9':'1211'

  'G':'2320', 'Gm':'1320', 'G7':'2120', 'GM7':'2220', 'Gm7':'1120',
  'Gdim':'1010', 'Gm7(b5)':'1110', 'Gaug':'2330', 'Gsus4':'3320',
  'G6':'2020', 'G7(9)':'2122', 'GM7(9)':'2222', 'GmM7':'5363', 'Gadd9':'2322'

  'G#':'3435', 'G#m':'2431', 'G#7':'3231', 'G#M7':'3331', 'G#m7':'2231',
  'G#dim':'2121', 'G#m7(b5)':'2221', 'G#aug':'3001', 'G#sus4':'4431',
  'G#6':'3131', 'G#7(9)':'3233', 'G#M7(9)':'3333', 'G#mM7':'6474', 'G#add9':'3433'

  'Ab':'3435', 'Abm':'2431', 'Ab7':'3231', 'AbM7':'3331', 'Abm7':'2231',
  'Abdim':'2121', 'Abm7(b5)':'2221', 'Abaug':'3001', 'Absus4':'4431',
  'Ab6':'3131', 'Ab7(9)':'3233', 'AbM7(9)':'3333', 'AbmM7':'6474', 'Abadd9':'3433'

  'A':'0012', 'Am':'0002', 'A7':'0010', 'AM7':'0011', 'Am7':'0000',
  'Adim':'3232', 'Am7(b5)':'3332', 'Aaug':'0112', 'Asus4':'0022',
  'A6':'04242', 'A7(9)':'2312', 'AM7(9)':'2412', 'AmM7':'0001', 'Aadd9':'2012'

  'A#':'1123', 'A#m':'1113', 'A#7':'1121', 'A#M7':'0123', 'A#m7':'1111',
  'A#dim':'1010', 'A#m7(b5)':'1011', 'A#aug':'1223', 'A#sus4':'1133',
  'A#6':'1120', 'A#7(9)':'3423', 'A#M7(9)':'5555', 'A#mM7':'1112', 'A#add9':'3123'

  'Bb':'1123', 'Bbm':'1113', 'Bb7':'1121', 'BbM7':'0123', 'Bbm7':'1111',
  'Bbdim':'1010', 'Bbm7(b5)':'1011', 'Bbaug':'1223', 'Bbsus4':'1133',
  'Bb6':'1120', 'Bb7(9)':'3423', 'BbM7(9)':'5555', 'BbmM7':'1112', 'Bbadd9':'3123'

  'B':'2234', 'Bm':'2224', 'B7':'2232', 'BM7':'1234', 'Bm7':'2222',
  'Bdim':'2121', 'Bm7(b5)':'2122', 'Baug':'2334', 'Bsus4':'2244',
  'B6':'2231', 'B7(9)':'4232', 'BM7(9)':'4133', 'BmM7':'2223', 'Badd9':'4234'


drawChordForm = (ctx, form)->
  paddingTop = 16
  [ flet_num, flet_width, flet_height ]  = [ 5, 12, 8 ]

  max_flet = 0
  for x in form.form
    if x > max_flet then max_flet = +x
  max_flet -= 4
  if max_flet < 0 then max_flet = 0

  ctx.fillText form.name, form.x, form.y + 10
  for i in [ 0..flet_num ]
    continue if max_flet != 0 and i == 0
    x = if i is 0 then 0 else 2 + (i - 1) * flet_width
    x = form.x + x
    y = form.y + paddingTop
    h = flet_height * 3
    ctx.fillRect x, y, 1, h
    if max_flet != 0 and i != flet_num
      ctx.fillText i + max_flet, x, y + 37
  for i in [ 0..3 ]
    x = form.x
    w = flet_width * flet_num - (flet_width >> 1)
    y = form.y + (i * flet_height) + paddingTop
    ctx.fillRect x, y, w, 1
  for x, i in form.form
    if x is '0' then continue
    x = form.x + 3 + flet_width * (x - 1 - max_flet) + 4
    y = form.y + i * flet_height + paddingTop
    ctx.fillRect x - 1, y - 2, 5, 5

drawRepeat = (ctx, form)->
  [x,y] = [form.x,form.y]
  p = if form.name is '|:' then [0,3,6,6] else [7,5,0,0]
  ctx.fillRect x + p[0], y + 4     , 2, 38
  ctx.fillRect x + p[1], y + 4     , 1, 38
  ctx.fillRect x + p[2], y + 4 + 11, 3, 3
  ctx.fillRect x + p[3], y + 4 + 23, 3, 3

drawRepeatLine = (ctx, form)->
  ctx.fillRect form.x, form.y + 7, 1, 34
  ctx.fillRect form.x, form.y + 7, 6, 1

drawRepeatNum = (ctx, form)->
  ctx.fillText form.name, form.x, form.y + 10

drawParen = (ctx, form)->
  [x,y] = [form.x,form.y+1.5]
  p = if form.name is '('
    [[4,2],[3,4],[2,6],[1,18],[2,6],[3,4],[4,2]]
  else
    [[1,2],[2,4],[3,6],[4,18],[3,6],[2,4],[1,2]]
  for [ _x, _y ] in p
    ctx.fillRect x + _x, y, 1, _y
    y += _y

drawStroke = (ctx, form)->
  return unless form.stroke

  [x, y] = [form.x,form.y]
  prev = ''
  for stroke in form.stroke
    stroke = stroke.toLowerCase()
    if stroke is '='
      stroke = (for i in [0...prev.length] by 1 then ' ').join ''
    prev = stroke
    for _ in stroke
      switch _
        when 'p', 'd'
          ctx.fillRect x  , y, 4, 1
          ctx.fillRect x  , y, 1, 6
          ctx.fillRect x+4, y, 1, 6
        when 'u'
          for [ _x , _y ] in [[0,0],[1,2],[2,4],[3,2],[4,0]]
            ctx.fillRect x+_x, y+_y, 1, 2
        when 'x'
          for [ _x , _y ] in [[0,1],[0,5],[1,2],[1,4],[2,3]]
            ctx.fillRect x+  _x, y+_y, 1, 1
            ctx.fillRect x+4-_x, y+_y, 1, 1
        when '_'
          x += 8
      x += 8 if _ != ','

drawSegno = (ctx, form)->
  [x, y] = [form.x ,form.y]
  ctx.fillRect x+1, y  , 3, 1
  ctx.fillRect x+1, y+1, 1, 1
  ctx.fillRect x+2, y+2, 1, 2
  ctx.fillRect x+3, y+4, 1, 1
  ctx.fillRect x+1, y+5, 3, 1
  ctx.fillRect x  , y+3, 1, 1
  ctx.fillRect x+4, y+2, 1, 1

drawCoda = (ctx, form)->
  [x, y] = [form.x, form.y]
  ctx.fillRect x  , y+1, 1, 3
  ctx.fillRect x+1, y  , 3, 1
  ctx.fillRect x+1, y+4, 3, 1
  ctx.fillRect x+4, y+1, 1, 3
  ctx.fillRect x+2, y-1, 1, 7
  ctx.fillRect x-1, y+2, 7, 1

drawRepeatStr = (ctx, form)->
  name = switch form.name
    when '^' then 'Fin'
    when '<' then (if form.hasSegno then 'D.S.' else 'D.C.')
  ctx.fillText name, form.x-4, form.y+52

drawMap =
  '#' : width:64, func:drawChordForm
  '_' : width:16
  '=' : width:64
  '|:': width:16, func:drawRepeat
  ':|': width:16, func:drawRepeat
  '-' : width:10, func:drawRepeatLine
  '1' : width: 6, func:drawRepeatNum
  '2' : width: 6, func:drawRepeatNum
  '3' : width: 6, func:drawRepeatNum
  '4' : width: 6, func:drawRepeatNum
  '(' : width:16, func:drawParen
  ')' : width:16, func:drawParen
  '!' : width: 0, func:drawStroke
  '$' : width: 0, func:drawSegno
  '*' : width: 0, func:drawCoda
  '<' : width:16, func:drawRepeatStr
  '^' : width:16, func:drawRepeatStr
  ';' : width:-1

getForm = do ->
  prev = null
  (m)->
    name = m[0]
    if name.charAt(0) is '!'
      if m[3]
        stroke = m[3].split ','
      return type:'!', bpm:m[1], shuffle:!!m[2], stroke:stroke
    if (form = CHORDS[name]) != undefined
      return prev = type:'#', name:name, form:form
    if (index = name.indexOf '@') != -1
      form = name.substr(index +1)
      name = name.substr(0, index)
      return prev = type:'#', name:name, form:form
    if name is '='
      return type:'=', name:prev.name, form:prev.form
    type:name, name:name

parse = do ->
  re = /(?:!(\d*)(:3)?([-PpDdUuXx,_=]*))|(?:[CDEFGAB][\#b]?(?:m7\(b5\)|M7\(9\)|7\(9\)|sus4|add9|aug|dim|mM7|m7|M7|m|7|6)?(?:@[0-5]{4})?)|\|:|:\||[-=_()1-4;$<^*]/g
  comment = /\'[\w\W]*$/
  (src)->
    src = src.split('\n').map( (x)-> x.replace(comment, '') ).join ''
    while (m = re.exec src) then getForm m

calculate = (src)->
  [ x, y, w, h ] = [ 8, 8, 8, 8 ]
  hasSegno   = false
  strokeOnly = false
  list = for _ in parse(src)
    m = drawMap[_.type]
    if m.width is -1
      [ x, y ] = if strokeOnly then [ 8, y + 12 ] else [ 8, y + 64 ]
      strokeOnly = false
    if strokeOnly
       if _.type != '!' then strokeOnly = false
    else if _.type is '!' then strokeOnly = true
    [ _.x, _.y, _.func ] = [ x, y, m.func ]
    if m.width is 0 then _.y -= 6
    switch _.type
      when '$' then   hasSegno = true
      when '<' then _.hasSegno = hasSegno
    x += m.width
    if w < x then w = x
    if h < y then h = y
    _
  list:list, width:w, height:h

getImageData = (src, opts={})->
  calced = calculate src
  
  canvas = document.createElement 'canvas'
  canvas.width  = calced.width
  canvas.height = calced.height + 64
  ctx = canvas.getContext '2d'

  if opts.background
    ctx.fillStyle = opts.background
    ctx.fillRect 0, 0, canvas.width, canvas.height
  ctx.strokeStyle = opts.color or '#000'
  ctx.fillStyle   = opts.color or '#000'
  for _ in calced.list
    _.func ctx, _ if _.func
  ctx.getImageData 0, 0, canvas.width, canvas.height

getImageSrc = (src, opts={})->
  if typeof src is 'string'
    src = getImageData src, opts
  if src instanceof ImageData
    imgData = src
  else return ''

  canvas = document.createElement 'canvas'
  canvas.width  = imgData.width
  canvas.height = imgData.height
  canvas.getContext('2d').putImageData imgData, 0, 0

  canvas.toDataURL 'image/png'

exports.parse = parse
exports.getImageData = getImageData
exports.getImageSrc  = getImageSrc


if typeof timbre != 'undefined'
  
  class Timeline extends timbre.Object
    constructor: (_args)->
      super 1, _args
      timbre.fn.timer @
      timbre.fn.fixKR @
    
    reset: ->
      _ = @_
      _.shuffle = false
      _.stroke  = ['D-u-']
      _.currentcmd  = null
      _.loopIgnore  = false
      _.codaIgnore  = false
      _.repeat      = false
      _.loopStack   = [index:0, maxCount:2, count:1]
      _.segnoIndex  = 0
      _.samples     = 0
      _.samplesIncr = 0
      _.beat = 0
      @setBpm 120
      
      _.i1 = 0
      _.i2 = _.stroke.length
      _.i3 = _.stroke[_.i2 % _.stroke.length].length

    setList: (list)->
      _ = @_
      _.list = list
      for i in [0..._.list.length] by 1
        cmd = _.list[i]
        if cmd.stroke
          stroke = cmd.stroke
          prev = ''
          for i in [0...stroke.length] by 1
            stroke[i] = stroke[i].replace /_/g, ''
            if stroke[i] is '='
              stroke[i] = prev
            prev = stroke[i]
          cmd.stroke = stroke
      @reset()

    setBpm: (bpm)->
      _ = @_
      l = if _.shuffle then 'l12' else 'l8'
      _.samplesIncr  = timbre.timevalue "bpm#{bpm} #{l}"
      _.samplesIncr *= timbre.samplerate * 0.001
      _.bpm = bpm
      _.i2 = _.i3 = 0

    process: (tickID)->
      _ = @_
      if _.samples <= 0
        if not _.shuffle or _.beat % 3 != 1
          if _.i3 >= _.stroke[_.i2 % _.stroke.length].length
            _.i3 = 0
            _.i2 += 1
            _.currentcmd = fetch.call @
              
          if _.currentcmd is null
            _.samples = Infinity
            return @emit 'end'
          
          form   = _.currentcmd.form
          stroke = _.stroke[_.i2 % _.stroke.length].charAt _.i3++

          if stroke != '-'
           @emit 'data', {form:form, stroke:stroke}

        _.samples += _.samplesIncr
        _.beat    += 1
      _.samples -= _.cellsize
      @

    test: ->
      while (cmd = fetch.call @) then console.log cmd

    fetch = ->
      _ = @_
      cmd = _.list[_.i1++]

      unless cmd
        return null
      
      if not (_.loopIgnore or _.codaIgnore)
        if cmd.type is '#' or cmd.type is '='
          return cmd  

      if _.codaIgnore and cmd.type != '*'
        return fetch.call @

      switch cmd.type
        when '|:'
          maxCount = 2
          for i in [_.i1..._.list.length]
            t = _.list[i].type
            if t is '|:'
              break
            if 1<= +t <= 4
              maxCount = +t
          _.loopStack.push index:_.i1, maxCount:maxCount, count:1
        when ':|'
          peek = _.loopStack[_.loopStack.length - 1]
          if not _.loopIgnore
            if peek
              if peek.count < peek.maxCount
                peek.count += 1
                _.i1 = peek.index              
              else
                _.loopStack.pop()
          _.loopIgnore = false
        when '1', '2', '3', '4'
          peek = _.loopStack[_.loopStack.length - 1]
          _.loopIgnore = (peek.count != +cmd.type)
              
        when '$'
            _.segnoIndex = _.i1
        when '*'
          if _.repeat then _.codaIgnore = not _.codaIgnore
        when '<'
          if not _.repeat
            _.repeat = true
            _.i1 = _.segnoIndex
        when '^'
          return null if _.repeat
        when '!'
          if cmd.bpm     then _.bpm     = cmd.bpm
          if cmd.shuffle then _.shuffle = cmd.shuffle
          if cmd.stroke  then _.stroke  = cmd.stroke
          @setBpm _.bpm
      fetch.call @

  timbre.fn.register 'ukulele-timeline', Timeline
  
  class Sequencer
    constructor: ->
      @tl = T('ukulele-timeline')
      @tl.emit = emit.bind @
      @sched   = T('schedule')
      @midicps = T('midicps')
      @send    = T('lpf', {freq:2800,Q:4,mul:0.6})
      @master  = T('delay', {time:120,fb:0.6,mix:0.15}, @send)

    pattern =
      x: volume:[0  ,0  ,0  ,0  ], delay:[ 0, 0, 0, 0], mute:true
      X: volume:[0.6,0.6,0.6,0.6], delay:[50,40,20, 0], mute:true
      D: volume:[0.8,0.8,0.9,1.0], delay:[50,40,20, 0], mute:false
      d: volume:[0.7,0.7,0.8,0.8], delay:[60,40,20, 0], mute:false
      P: volume:[1.0,0.9,0.9,0.8], delay:[ 0,40,80,95], mute:false
      p: volume:[0.8,0.8,0.7,0.7], delay:[ 0,40,80,95], mute:false
      U: volume:[1.0,0.9,0.8,0.8], delay:[ 0,20,40,50], mute:false
      u: volume:[0.8,0.8,0.7,0.7], delay:[ 0,20,40,60], mute:false

    sched = (that, freq, mul, mute)->
      ->
        if mute
          send = T('perc', {r:15}).bang().appendTo that.send
          T('noise', {mul:0.4}).appendTo send
        else
          send = that.send
          T('perc', {a:10,r:150},
            T('osc', {wave:'fami(25)',freq:freq,mul:mul*0.75})
          ).bang().appendTo send
        T('pluck', {freq:freq*2,mul:mul*0.6}).bang().appendTo send

    emit = (type, opts)->
      switch type
        when 'data'
          {form, stroke} = opts
          form = [
              69 + (form.charAt(0)|0)
              64 + (form.charAt(1)|0)
              60 + (form.charAt(2)|0)
              67 + (form.charAt(3)|0)
          ]
          if (p = pattern[stroke])
            @send.nodes.splice 0
            for i in [0...3]
              if form[i] is 0 or p.volume[i] is 0 then continue
              func = sched(@, @midicps.at(form[i]), p.volume[i], p.mute)
              @sched.sched p.delay[i], func
        when 'end'
          @emit 'end'
      0

    play: (data)->
      @send.nodes.splice 0      
      @tl.setList parse(data)
      # @tl.test()
      @tl.start()
      @sched.start()
      @master.play()
    
    pause: ->
      @tl.stop()
      @sched.stop()
      @master.pause()

  exports.Sequencer = Sequencer 


if typeof CodeMirror != 'undefined'
  CodeMirror.defineMode 'ukulele', ->
    stroke = /^!\d*(?::3)?[-PpDdUuXx,_=]*/
    chord  = /^[CDEFGAB][\#b]?(?:m7\(b5\)|M7\(9\)|7\(9\)|sus4|add9|aug|dim|mM7|m7|M7|m|7|6)?(?:@[0-5]{4})?/
    repeat = /^([-1234$<^*]|\|:|:\|)/

    token: (stream, state)->
      switch
        when stream.eat ';'
          'newline'
        when stream.eat /[()]/
          'blacket'
        when stream.eat /[_=]/
          'space'
        when stream.match stroke
          'stroke'
        when stream.match chord
          'chord'
        when stream.match repeat
          'repeat'
        when stream.eat "'"
          stream.skipToEnd()
          'comment'
        else
          stream.next()
          null

window.ukulele = exports
