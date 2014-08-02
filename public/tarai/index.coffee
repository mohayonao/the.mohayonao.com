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

tarai = new Tarai
scale = new sc.Scale [ 0, 2, 3, 7, 9 ], 12, 'Kumoi'
baseRoot  = 62 # D3

pattern = [ 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 1, 1 ]
car     = []

synth  = T('PluckGen')
master = T('chorus', delay:4, rate:1, depth:40, synth)
master = T('delay', time:'bpm120 l8.', fb:0.4, mix:0.3, master)

timer = T('interval', interval:'bpm120 l16', (count)->
  i = count & 15

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
    noteNum += 12 * (count % 2)

    synth.noteOn noteNum, 100
)

app = new class
  constructor: ->
    @isPlaying = false

  init: (x, y, z)->
    tarai.init x, y, z

  play: ->
    @isPlaying = true
    tarai.reset()
    master.play()
    timer.start()

  stop: ->
    @isPlaying = false
    master.pause()
    timer.stop()

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
