$ ->
  'use strict'

  WavDecoder.load("./drumkit.wav").then (wav)->
    waves = []
    len = wav.buffer[0].length >> 3
    waves[0] = wav.buffer[0].subarray len * 0, len * 1
    waves[1] = wav.buffer[0].subarray len * 1, len * 2
    waves[2] = wav.buffer[0].subarray len * 2, len * 3

    hrm = new HexRhythmMachine(wav.samplerate, waves)

    hrm.setPattern "aa0980 aa08a2"
    pico.play hrm
