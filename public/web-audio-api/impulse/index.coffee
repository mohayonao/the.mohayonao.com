'use strict'

class Impulse
  constructor: (@context)->
    @destination = @context.destination
    @_node = null

  connect: (node)->
    @destination = node

  start: (t)->
    buffer = @context.createBuffer(1, 4, @context.sampleRate)
    buffer.getChannelData(0).set new Float32Array([ 1 ])

    bufSrc = @context.createBufferSource()
    bufSrc.buffer = buffer

    bufSrc.start t
    bufSrc.connect @destination

    bufSrc.onended = (e)=>
      @onend? e

    @_node = bufSrc

  stop: ->
    @_node?.disconnect()
    @_node = null

$ ->
  context = new AudioContext()

  scpNode = context.createScriptProcessor(1024, 1, 1)
  scpNode.connect(context.destination)

  scpNode.onaudioprocess = (e)->
    out = e.outputBuffer.getChannelData(0)
    out.set e.inputBuffer.getChannelData(0)

    impulsed = -1

    for i in [0...1024]
      if out[i] != 0
        impulsed = i

    if impulsed != -1
      console.log impulsed, new Float32Array(out)

  $('#play').on 'click', ->
    impulse = new Impulse(context)
    impulse.connect(scpNode)

    impulse.onend = (e)->
      impulse.stop()

    impulse.start context.currentTime
