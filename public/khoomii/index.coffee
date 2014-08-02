'use strict'

clip = (num, min, max)->
  Math.max(min, Math.min(num, max))

linlin = (num, inMin, inMax, outMin, outMax)->
  (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin

linexp = (num, inMin, inMax, outMin, outMax)->
  Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin

class Khoomii
  FORMANT_PARAMS =
    a: [ 700, 1200, 2900 ]
    i: [ 300, 2700, 2700 ]
    u: [ 390, 1200, 2500 ]
    e: [ 450, 1750, 2750 ]
    o: [ 460,  880, 2800 ]

  constructor: ->
    @context = new AudioContext
    @freq = 174.61412048339844
    @out = @context.createGain()

    @mod = @context.createOscillator()
    @mod.frequency.value = 0.8
    @modGain = @context.createGain()
    @modGain.gain.value = 6
    @mod.connect @modGain

    @voice = @context.createOscillator()
    @voice.type = 'sawtooth'
    @voice.frequency.value = @freq
    @modGain.connect @voice.detune

    @mod.start(0)
    @voice.start(0)

    @bpf = @context.createBiquadFilter()
    @bpf.type = "bandpass"
    @bpf.frequency.value = 830
    @bpf.Q.value = 0.45

    @formants = _.sample(FORMANT_PARAMS).map (freq)=>
      formant = @context.createBiquadFilter()
      formant.type = "bandpass"
      formant.frequency.value = freq
      formant.Q.value = 12
      @voice.connect formant
      formant.connect @bpf
      formant

    @delay = @context.createDelay()
    @delay.delayTime.value = 0.25
    @delayFB = @context.createGain()
    @delayFB.gain.value = 0.125
    @delayDry = @context.createGain()
    @delayDry.gain.value = 0.7
    @delayWet = @context.createGain()
    @delayWet.gain.value = 0.3

    @bpf.connect @delay
    @bpf.connect @delayDry

    @delay.connect @delayFB
    @delay.connect @delayWet
    @delayFB.connect @delay

    @delayDry.connect @out
    @delayWet.connect @out

    @destination = @out

  change: ->
    _.sample(FORMANT_PARAMS).map (freq, i)=>
      freq *= (Math.random() * 0.15) + 0.925
      time = @context.currentTime + 0.25
      @formants[i].frequency.linearRampToValueAtTime(freq, time)

  setValue: (type, value)->
    switch type
      when 'voice.freq'  then @voice.frequency.value = value
      when 'voice.mod'   then @mod.frequency.value   = value
      when 'voice.depth' then @modGain.gain.value    = value
      when 'voice.band'  then @bpf.frequency.value   = value
      when 'spiritual'   then @delayFB.gain.value    = value

  play: ->
    @change()
    @destination.connect @context.destination

  stop: ->
    @destination.disconnect()

app = new class
  constructor: ->

  setValue: (type, value)->
    if @khoomii then switch type
      when 'voice.freq'
        freq = linexp(value, 1, 100, 65.40639132514966, 261.6255653005986)
        @khoomii.setValue 'voice.freq', freq
      when 'voice.mod'
        freq  = linexp(value, 1, 100, 0.05, 25)
        depth = 100 - Math.abs(value - 50) * 2
        depth = linlin(depth, 1, 100, 1, 30)
        @khoomii.setValue 'voice.mod'  , freq
        @khoomii.setValue 'voice.depth', depth
      when 'voice.band'
        freq  = linexp(value, 1, 100, 130.8127826502993, 2*4186.009044809578)
        @khoomii.setValue 'voice.band', freq
      when 'spiritual'
        level = linlin(value, 1, 100, 0.2, 0.99)
        @khoomii.setValue 'spiritual', level

  play: ->
    @khoomii = new Khoomii()
    @khoomii.play()

    @timerId = setInterval =>
      @khoomii.change()
    , 250

  stop: ->
    @khoomii.stop()
    clearInterval @timerId

vue = new Vue
  el: '#app'

  data:
    params: [
      { name: 'voice.freq', value: 70 }
      { name: 'voice.mod' , value: 10 }
      { name: 'voice.band', value: 45 }
      { name: 'spiritual' , value:  5 }
    ]
    isPlaying: false

  methods:
    update: (type, value)->
      params = _.pluck @params, 'value'
      window.location.replace "#" + params.join ','

      app.setValue type, clip(value, 1, 100)

    play: ->
      @isPlaying = not @isPlaying
      if @isPlaying
        app.play()
        @params.forEach (param)=>
          app.setValue param.name, clip(param.value, 1, 100)
      else
        app.stop()

    tweet: ->
      if utils.isJp()
        text  = _.sample [
          '', ''
          '聞いてください。'
          'これが...'
          'あなたに届けたい'
          'みんな！聞いてくれ！！！'
          '最初で最後の'
        ]
        text += _.sample [
          'ホーミー'
          'ホーミー'
          '俺のホーミー'
          '僕のホーミー'
          '最高のホーミー'
          '君のためのホーミー'
          'いつかのホーミー'
          'ホーミー...'
          'ホーミー (for me)'
        ]
      else
        text = document.title
      utils.tweet text:text, url:window.location.href

if window.location.hash
  hash = decodeURIComponent(window.location.hash.substr 1)
  items = hash.split ','
  vue.params.forEach (param, i)->
    param.value = clip items[i]|0, 1, 100

vue.update()
