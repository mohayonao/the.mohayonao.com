'use strict'

evalFunction = (f)->
  eval """(function() {
  var self,location,navigator,onmessage,postMessage,importScripts,close,setInterval,setTimeout,XMLHttpRequest,Worker;
  return function(t) { return #{f}; };
})()"""

do (evalFunction)=>
  func = (t)->0
  tcnt = 0

  update = (t)->
    stream = new Array(4096)
    try
      for i in [0...stream.length]
        stream[i] = (func t++)|0
      return stream
    catch e then return null

  @onmessage = (e)=>
    if typeof e.data is 'string'
      try
        func = evalFunction e.data
        func (Math.random() * 65536)|0
        @postMessage 'accept'
      catch err
        func = (t)->0
        @postMessage 'error'
    else
      res = update tcnt
      if res is null
        @postMessage 'error'
      else
        tcnt += res.length
        @postMessage res
  @postMessage 'ready'

  0
