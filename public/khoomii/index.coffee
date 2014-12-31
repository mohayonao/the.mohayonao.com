'use strict'

neu = neume()

FORMANT_PARAMS =
  a: [ 700, 1200, 2900 ]
  i: [ 300, 2700, 2700 ]
  u: [ 390, 1200, 2500 ]
  e: [ 450, 1750, 2750 ]
  o: [ 460,  880, 2800 ]

clip = (num, min, max)->
  Math.max(min, Math.min(num, max))

linlin = (num, inMin, inMax, outMin, outMax)->
  (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin

linexp = (num, inMin, inMax, outMin, outMax)->
  Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin

KhoomiiVoice = ($, formants)->
  voiceFreq  = $('@voiceFreq' , value: 174.61412048339844)
  voiceMod   = $('@voiceMod'  , value: 0.8)
  voiceDepth = $('@voiceDepth', value: 6)
  voiceBand  = $('@voiceBand' , value: 830)
  spiritual  = $('@spiritual' , value: 0.125)

  out = $('saw', freq: voiceFreq, detune: $('sin', freq: voiceMod, mul: voiceDepth))
  out = _.map formants, (freq, index)-> $('bpf', { freq: $(formants, key: index, lag: 0.25, curve: 'exp'), Q: 12 }, out)
  out = $('bpf', { freq: voiceBand, Q: 0.45 }, out)
  out = [ out, $('delay', { delay: 0.25, feedback: spiritual, mul: 0.45 }, out) ]
  out = $('lpf', { freq: 3200, Q: 2, mul: 0.8 }, out)

class Khoomii

  constructor: ->
    @_voice = null
    @_formants = new Float32Array(3)
    @_formants.set _.sample(FORMANT_PARAMS)

  change: ->
    @_formants.set _.sample(FORMANT_PARAMS).map (freq)=>
      freq * ((Math.random() * 0.15) + 0.925)

  setValue: (type, value)->
    @_voice[type].value = value if @_voice

  play: ->
    neu.start()
    @_voice?.stop()
    @_voice = neu.Synth(KhoomiiVoice, @_formants).start()

  stop: ->
    @_voice?.stop()
    @_voice = null
    neu.stop()

app = new class
  constructor: ->

  setValue: (type, value)->
    if @khoomii then switch type
      when 'voice.freq'
        freq = linexp(value, 1, 100, 65.40639132514966, 261.6255653005986)
        @khoomii.setValue 'voiceFreq', freq
      when 'voice.mod'
        freq  = linexp(value, 1, 100, 0.05, 25)
        depth = 100 - Math.abs(value - 50) * 2
        depth = linlin(depth, 1, 100, 1, 30)
        @khoomii.setValue 'voiceMod'  , freq
        @khoomii.setValue 'voiceDepth', depth
      when 'voice.band'
        freq  = linexp(value, 1, 100, 130.8127826502993, 2*4186.009044809578)
        @khoomii.setValue 'voiceBand', freq
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
      text = utils.lang
        ja: 'ホーミー'
        '': document.title
      utils.tweet text:text, url:window.location.href

if window.location.hash
  hash = decodeURIComponent(window.location.hash.substr 1)
  items = hash.split ','
  vue.params.forEach (param, i)->
    param.value = clip items[i]|0, 1, 100

vue.update()
