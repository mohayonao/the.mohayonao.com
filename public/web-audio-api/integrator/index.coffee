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
    if @destination.getOutlet
      bufSrc.connect @destination.getOutlet()
    else
      bufSrc.connect @destination

    bufSrc.onended = (e)=>
      @onend? e

    @_node = bufSrc

  stop: ->
    @_node?.disconnect()
    @_node = null

class Integrator
  constructor: (@context, @coef)->
    @destination = @context.destination
    @_node = null

  getOutlet: ->
    return @_node

  connect: (node)->
    @destination = node

  start: (_in)->
    out   = @context.createGain()
    delay = @context.createDelay(128 / @context.sampleRate)
    leak  = @context.createGain()

    delay.delayTime = 1 / @context.sampleRate
    leak.gain.value = @coef

    _in.connect(out)

    out.connect delay
    delay.connect leak
    leak.connect out

    out.connect @destination

    @_node = out

  stop: ->


$ ->
  context = new AudioContext()

  scpNode = context.createScriptProcessor(1024, 1, 1)
  scpNode.connect(context.destination)

  count = 0

  scpNode.onaudioprocess = (e)->
    out = e.outputBuffer.getChannelData(0)
    out.set e.inputBuffer.getChannelData(0)

    impulsed = -1

    for i in [0...1024]
      if out[i] != 0
        impulsed = i

    if impulsed != -1 and count < 10
      console.log impulsed, new Float32Array(out)
      count += 1

  $('#play').on 'click', ->
    impulse = new Impulse(context)
    integrator = new Integrator(context, 1)

    impulse.connect(integrator)
    integrator.connect(scpNode)

    impulse.onend = (e)->
      impulse.stop()

    integrator.start impulse
    impulse.start context.currentTime
