'use strict'

clip = (num, min, max)->
  Math.max(min, Math.min(num, max))

class Tarai
  init: (x, y, z)->
    @list = []
    @index = 0
    @tarai x, y, z

  tarai: (x, y, z)->
    @list.push [ x, y, z ]
    if x <= y then y
    else @tarai @tarai(x-1, y, z), @tarai(y-1, z, x), @tarai(z-1, x, y)

  fetch: ->
    @list[@index++]

  reset: ->
    @index = 0

Neume = neume(new AudioContext())

tarai = new Tarai
scale = new sc.Scale [ 0, 2, 3, 7, 9 ], 12, 'Kumoi'
baseRoot  = 62 # D3

pattern = [ 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 1, 1 ]
car     = []

Pluck = ($, freq)->
  $([ 0.995, 1.005 ].map (x)-> $('saw', freq: freq * x))
  .$('lpf', freq: $('xline', start: 3200, end: 440, dur: 0.1), Q: 7.5)
  .$('xline', start: 0.2, end: 0.0001, dur: 1.5).on('end', $.stop)
  .$('out', bus: 1)

Destination = ($)->
  $('in', bus: 1)
  .mul(0.125).$('delay', delay: "8nd", feedback: 0.45)
  .$('lpf', freq: 2400, $('in', bus: 1).mul(0.5))

process = (e)->
  i = e.count % 16

  if i is 0
    car = tarai.fetch()?.sort()

  if car
    p = pattern[i]
    i = car[p]
    switch p
      when 0 then vue.x = clip(i, 0, 10)
      when 1 then vue.y = clip(i, 0, 10)
      when 2 then vue.z = clip(i, 0, 10)
    noteNum = Math.round( scale.performDegreeToKey(i) ) + baseRoot
    noteNum += 12 * (e.count % 2)

  Neume.Synth(Pluck, noteNum.midicps()).start(e.playbackTime)

app = new class
  constructor: ->
    @isPlaying = false
    @_dst = null
    @_timer = null

  init: (x, y, z)->
    tarai.init x, y, z

  play: ->
    @isPlaying = true

    @_dst?.stop()
    @_timer?.stop()
    @_dst = Neume.Synth(Destination).start()
    @_timer = Neume.Interval(0.125, process).start()

    tarai.reset()

  stop: ->
    @isPlaying = false

    @_dst?.stop()
    @_timer?.stop()
    @_dst = null
    @_timer = null

vue = new Vue
  el: '#app'

  data:
    x : 10
    y :  5
    z :  0
    xs: _.range(11).map (x)-> value: x
    ys: _.range(11).map (y)-> value: y
    zs: _.range(11).map (z)-> value: z
    isPlaying: app.isPlaying

  methods:
    play: ->
      if app.isPlaying
        app.stop()
      else
        window.location.replace "##{@x},#{@y},#{@z}"
        app.init @x, @y, @z
        app.play()
      @isPlaying = app.isPlaying

    stop: ->
      if app.isPlaying
        app.stop()
      @isPlaying = app.isPlaying

    tweet: ->
      x = clip(@x, 0, 10)
      y = clip(@y, 0, 10)
      z = clip(@z, 0, 10)
      text  = 'tarai-music'
      url   = "http://#{location.host}/tarai/##{x},#{y},#{z}"
      utils.tweet text:text, url:url

window.onhashchange = ->
  items = decodeURI(location.hash.substr(1).trim()).split(',')
  vue.x = clip(items[0]|0, 0, 10)
  vue.y = clip(items[1]|0, 0, 10)
  vue.z = clip(items[2]|0, 0, 10)

window.onhashchange() if location.hash
