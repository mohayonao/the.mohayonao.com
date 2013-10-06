$ ->
  'use strict'

  sc.use 'prototype'

  Array::sorted = ->
    do @.sort
    @
  
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
  tarai.init 10, 5, 0
  
  scale = new sc.Scale [0,2,3,7,9], 12, 'Kumoi'
  baseRoot  = 62 # D3
  
  pattern = [ 0,0,1,1,2,2,1,1,0,0,1,1,2,2,1,1 ]
  car = []

  synth  = T('PluckGen')
  master = T('chorus', delay:4, rate:1, depth:40, synth)
  master = T('delay', time:'bpm120 l8.', fb:0.4, mix:0.3, master)

  timer = T('interval', interval:'bpm120 l16', (count)->
    count &= 15

    if count is 0
      car = tarai.fetch()?.sorted()

    if car
      i = car[pattern[count]]
      noteNum = Math.round( scale.performDegreeToKey(i) ) + baseRoot
      noteNum += 12 * (count % 2)

      synth.noteOn noteNum, 100
  )

  isPlaying = false
  $('#play').on 'click', ->
    isPlaying = not isPlaying
    if isPlaying
      tarai.reset()
      master.play()
      timer.start()
      $(this).addClass 'btn-active'
    else
      master.pause()
      timer.stop()
      $(this).removeClass 'btn-active'
