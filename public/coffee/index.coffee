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
    if view src
      prev = src

  view = (src)->
    try
      tokens = CoffeeScript.tokens src
      list = tokens.map (items)->
        tag   = (items[0] + '                    ').substr 0, 20
        "#{tag}#{items[1]}"
      $tokens.val list.join '\n'
      nodes = CoffeeScript.nodes tokens
      dst = nodes.compile bare:true
      $dst.val dst
      $src.css 'color', 'black'
      true
    catch e
      $src.css 'color', 'red'
      false

  $('#link').on 'click', ->
    code = $src.val().trim()
    window.location = "##{encodeURIComponent(code)}"

  hash = decodeURIComponent location.hash.substr(1)
  if hash
    $src.val hash
    view hash
