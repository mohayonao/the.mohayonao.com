$ ->
  'use strict'

  AudioContext = window.AudioContext or window.webkitAudioContext
  
  context = new AudioContext

  bufSrc = do context.createBufferSource
  jsNode = if context.createScriptProcessor
    context.createScriptProcessor 1024, 1, 1
  else
    context.createJavaScriptNode  1024, 1, 1
    
  jsNode.onaudioprocess = (e)->
    e.outputBuffer.getChannelData(0).set e.inputBuffer.getChannelData(0)
  
  decode = (path, callback)->
    xhr = new XMLHttpRequest
    xhr.open 'get', path
    xhr.responseType = 'arraybuffer'
    xhr.onreadystatechange = ->
      if xhr.readyState is 4 and xhr.status is 200
        bufSrc.buffer = context.createBuffer xhr.response, true
        do callback
    do xhr.send

  play = ->
    bufSrc.noteOn? 0
    bufSrc.connect jsNode
    jsNode.connect context.destination

    $(window).on 'click', ->
      do jsNode.disconnect

  decode 'sample.ogg', ->
    window.postMessage 'bang', '*'

  window.onmessage = (e)->
    do play if e.data is 'bang'
