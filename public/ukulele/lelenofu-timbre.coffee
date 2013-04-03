'use strict'

class Timeline extends timbre.Object
  constructor: (_args)->
    super 1, _args
    timbre.fn.timer this
    timbre.fn.fixKR this

  reset: ->
    @bpm = 120
    @shuffle = false
    @stroke  = ['D-u-']
    @currentcmd = null
    @loopIgnore = false
    @codaIgnore = false
    @repeat     = false
    @loopStack  = [{index:0, maxCount:2, count:1}]
    @segnoIndex = 0
    @samples    = 0
    @samplesMax   = 0
    @samplesCount = 0
    @setBpm @bpm
    @i1 = 0
    @i2 = @stroke.length
    @i3 = @stroke[@i2 % @stroke.length].length

  setList: (list)->
    @list = list
    for i in [0...@list.length] by 1
      cmd = @list[i]
      if cmd.type is '!'
        if cmd.stroke
          stroke = cmd.stroke
          prev = ''
          for i in [0...stroke.length] by 1
            stroke[i] = stroke[i].replace /_/g, ''
            if stroke[i] is '='
              stroke[i] = prev
            prev = stroke[i]
          cmd.stroke = stroke
    console.log @list
    @reset()

  setBpm: (bpm)->
    @bpm = bpm
    if @shuffle
      @samplesMax = timbre.timevalue "bpm#{@bpm} l12"
    else
      @samplesMax = timbre.timevalue "bpm#{@bpm} l8"
    @samplesMax = @samplesMax * timbre.samplerate * 0.001
    @i2 = @i3 = 0

  process: (tickID)->
    if @samples <= 0
      if not @shuffle or @samplesCount % 3 != 1
        if @i3 >= @stroke[@i2 % @stroke.length].length
          @i3 = 0
          @i2 += 1
          @currentcmd = fetch.call @
            
        if @currentcmd is null
          return @eof()
        
        f = @currentcmd.form
        s = @stroke[@i2 % @stroke.length].charAt @i3++

        @callback(f, s) if s != '-'

      @samples += @samplesMax
      @samplesCount += 1
    @samples -= @_.cellsize
    @

  fetch = ->
    cmd = @list[@i1++]

    return null unless cmd
    return cmd  if (cmd.type is '#' or cmd.type is '=') and !@loopIgnore and !@codaIgnore

    if @codaIgnore and cmd.type != '*'
      return fetch.call @

    switch cmd.type
      when '|:'
        @loopStack.push index:@i1, maxCount:2, count:1
      when ':|'
        lop = @loopStack[@loopStack.length - 1]
        @loopIgnore = false
        if lop
          if lop.count < lop.maxCount
            lop.count += 1
            @i1 = lop.index
          else @loopStack.pop()
      when '1', '2', '3', '4'
        lop = @loopStack[@loopStack.length - 1]
        if lop
          count = +cmd.type
          @loopIgnore = (lop.count != count)
          if lop.maxCount < count then lop.maxCount = count
      when '$'
          @segnoIndex = @i1
      when '*'
        if @repeat then @codaIgnore = not @codaIgnore
      when '<'
        if not repeat
          @repeat = true
          @i1 = @segnoIndex
      when '^'
        return null if @repeat
      when '!'
        if cmd.bpm     then @bpm     = cmd.bpm
        if cmd.shuffle then @shuffle = cmd.shuffle
        if cmd.stroke  then @stroke  = cmd.stroke
        @setBpm @bpm
    fetch.call @

timbre.fn.register 'lelenofu-timeline', Timeline


class Sequencer
  constructor: ->
    @tl = T('lelenofu-timeline')
    @tl.callback = @pluck.bind this
    @tl.eof = => @eof?()
    @sched   = T('schedule')
    @midicps = T('midicps')
    @send    = T('lpf', {freq:2800,Q:4,mul:0.6})
    @master  = T('delay', {time:120,fb:0.6,mix:0.15}, @send)

  pluck: (form, stroke)->
    form = [
        69 + (form.charAt(0)|0)
        64 + (form.charAt(1)|0)
        60 + (form.charAt(2)|0)
        67 + (form.charAt(3)|0)
    ]
    switch stroke
      when 'x'
        form = volume = delay = [ 0, 0, 0, 0 ]
        mute   = true
      when 'X'
        volume = [0.6, 0.6, 0.6, 0.6]
        delay  = [50, 40, 20, 0]
        mute   = true
      when 'D'
        volume = [0.85, 0.88, 0.9, 1]
        delay  = [50, 40, 20, 0]
        mute   = false
      when 'd'
        volume = [0.62, 0.63, 0.65, 0.7]
        delay  = [60, 40, 20, 0]
        mute   = false
      when 'P'
        volume = [1, 0.9, 0.88, 0.85]
        delay  = [0, 40, 80, 100]
        mute   = false
      when 'p'
        volume = [0.7, 0.65, 0.63, 0.62]
        delay  = [0, 40, 80, 100]
        mute   = false
      when 'U'
        volume = [1, 0.9, 0.88, 0.85]
        delay  = [0, 20, 40, 50]
        mute   = false
      when 'u'
        volume = [0.7, 0.65, 0.63, 0.62]
        delay  = [0, 20, 40, 60]
        mute   = false
      else
        form = volume = delay = [ 0, 0, 0, 0 ]
        mute = true
    @send.nodes.splice 0
    for i in [0..3]
      if form[i] is 0 then continue
      freq = @midicps.at(form[i])
      mul  = volume[i]
      @sched.sched delay[i], sched_pluck(this, freq, mul, mute)
    0

  sched_pluck = (that, freq, mul, mute)->
    ->
      if mute
        send = T('perc', {r:15}).bang().appendTo that.send
        T('noise', {mul:0.4}).appendTo send
      else
        send = that.send
        T('perc', {a:10,r:150},
          T('osc', {wave:'fami(25)',freq:freq,mul:mul*0.75})
        ).bang().appendTo send
      T('pluck', {freq:freq*2,mul:mul*0.8}).bang().appendTo send

  eof: ->
    @pause()

  play: (list)->
    @tl.setList list
    @tl.start()
    @sched.start()
    @send.nodes.splice 0
    @master.play()
  
  pause: ->
    @tl.stop()
    @sched.stop()
    @master.pause()

window.lelenofu.Sequencer = Sequencer
