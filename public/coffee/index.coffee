$ ->
  'use strict'

  $src    = $('#src')
  $tokens = $('#tokens')
  $nodes  = $('#nodes')
  $dst    = $('#dst')

  prev = null
  $src.on 'keyup', ->
    src = $src.val().trim()
    if src is prev
      return
    try
      tokens = CoffeeScript.tokens src
      list = tokens.map (items)->
        tag   = (items[0] + '                    ').substr 0, 20
        "#{tag}#{items[1]}"
      nodes = CoffeeScript.nodes tokens
      dst = nodes.compile bare:true
      $tokens.val list.join '\n'
      $dst.val dst
      $src.css 'color', 'black'
    catch e
      $src.css 'color', 'red'
    prev = src
