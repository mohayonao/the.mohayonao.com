'use strict'

audioContext = new AudioContext

bufSrc = null
buffer = null

$test = $('#test')

$test.on 'click', ->
  if bufSrc
    bufSrc.stop()
    bufSrc = null
    return

  if buffer
    bufSrc = audioContext.createBufferSource()
    bufSrc.buffer = buffer
    bufSrc.loop = true

    osc = audioContext.createOscillator()
    osc.frequency.value = 0.25

    amp = audioContext.createGain()
    amp.gain.value = 0.5

    osc.connect(amp)
    amp.connect(bufSrc.playbackRate)

    osc.start(0)

    bufSrc.start(0)
    bufSrc.connect audioContext.destination

$test.attr('disabled', 'disabled')

xhr = new XMLHttpRequest
xhr.open 'GET', './amen.wav'
xhr.responseType = 'arraybuffer'
xhr.onload = ->
  audioContext.decodeAudioData xhr.response, (result)->
    buffer = result
    $test.removeAttr('disabled')
xhr.send()
