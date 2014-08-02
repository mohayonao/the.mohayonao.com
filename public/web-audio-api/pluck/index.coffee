'use strict'

audioContext = new AudioContext

DURATION = 0.5

midicps = (midi)->
  440 * Math.pow(2, (midi - 69) * 1 / 12)

pluck = (freq, duration)->
  sampleRate = audioContext.sampleRate
  buffer = audioContext.createBuffer(1, sampleRate * duration, audioContext.sampleRate)
  buffer.getChannelData(0).set new KarplusStrong(sampleRate, freq, duration)
  buffer

generators = [ 0, 0, 7, 0, 8, 0, 7, 0,  5, 3, 2, 3, 5, 3, 2, -2 ].map (x)->
  pluck(midicps(x + 48), DURATION)

timerId = 0
count   = 0

$('#test').on 'click', ->

  if timerId
    clearInterval timerId
    timerId = 0
  else
    timerId = setInterval ->
      vco = audioContext.createBufferSource()
      vco.buffer = generators[count++ % generators.length]

      vcf = audioContext.createBiquadFilter()
      vcf.type = "lowpass"
      vcf.frequency.value = 2400
      vcf.Q.value = 0.5

      vca = audioContext.createGain()
      vca.gain.setValueAtTime(0.5, audioContext.currentTime)
      vca.gain.linearRampToValueAtTime(0, audioContext.currentTime + DURATION)

      vco.start(0)
      vco.onended = ->
        vca.disconnect()

      vco.connect(vcf)
      vcf.connect(vca)
      vca.connect(audioContext.destination)
    , 250
