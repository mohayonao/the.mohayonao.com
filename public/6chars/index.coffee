'use strict'

random_gen = do ->
  HH = "55|88|88|aa|aa|aa|aa|bb|ff|ff|ff|ae|ae"
  SD = "[002][8899b]"
  BD = "[8a][288aab]"

  HH = "#{HH}|#{HH}|#{HH}|[0-9a-f]{2}"
  SD = "#{SD}|#{SD}|#{SD}|#{SD}|#{SD}|[0-9a-f]{2}"
  BD = "#{BD}|#{BD}|#{BD}|#{BD}|#{BD}|[0-9a-f]{2}"

  (cnt='+')->
    String_random("(1[046]0; )?((#{HH})(#{SD})(#{BD}) )#{cnt}").trim()

app = new class App
  constructor: ->
    @isPlaying = false
    @pattern   = ""

  init: (@hrm)->

  play: ->
    @isPlaying = not @isPlaying
    if @isPlaying
      @hrm.setPattern @pattern
      pico.play @hrm
    else
      pico.pause()
    @isPlaying

  set: (pattern)->
    pattern = pattern.trim()
    if @pattern isnt pattern
      @pattern = pattern
      @hrm.setPattern pattern
    true

  validate: (pattern)->
    @hrm.validate pattern

vue = new Vue
  el: '#app'

  data:
    value: ''
    list : _.range(10).map -> value: ''
    hasError : false
    isPlaying: false

  methods:
    encodeURI: window.encodeURI

    play: ->
      @isPlaying = app.play()

    random: ->
      [ 2, 2, 4, 4, 8, 8, 0, 0, 0, 0 ].forEach (n, i)=>
        cnt = if n is 0 then '+' else "{#{n}}"
        @list[i].value = random_gen cnt
      @value = _.sample(@list).value

    tweet: ->
      value = app.pattern
      text  = '6chars drums'
      url   = "http://#{location.host}/6chars/##{encodeURI(value)}"
      utils.tweet text:text, url:url

vue.$watch 'value', ->
  ok = app.validate @value
  app.set @value if ok
  @hasError = not ok

vue.random()

window.onhashchange = ->
  vue.value = decodeURI location.hash.substr(1).trim()

WavDecoder.load('./drumkit.wav').then (wav)->
  waves = []
  len = wav.buffer[0].length >> 2
  waves[0] = wav.buffer[0].subarray len * 0, len * 1
  waves[1] = wav.buffer[0].subarray len * 1, len * 2
  waves[2] = wav.buffer[0].subarray len * 2, len * 3
  waves.samplerate = wav.samplerate

  app.init new HexRhythmMachine(pico.samplerate, waves)

  window.onhashchange() if location.hash
