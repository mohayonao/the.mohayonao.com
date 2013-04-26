$ ->
  'use strict'

  editor = ace.edit 'editor'
  editor.setTheme 'ace/theme/github'
  editor.getSession().setTabSize 4
  editor.getSession().setMode 'ace/mode/coffee'
  editor.focus()

  editor.commands.addCommand
    name: 'play'
    bindKey:
      win: 'Ctrl-Enter'
      mac: 'Command-Enter'
    exec: (editor)->
      sess = editor.session
      code = sess.getTextRange editor.getSelectionRange()
      if code is ''
        code = sess.getLine editor.getCursorPosition().row
      code = CoffeeScript.compile code, bare:true
      eval.call window, code

  editor.commands.addCommand
    name: 'stop'
    bindKey:
      win: 'Ctrl-.'
      mac: 'Command-.'
    exec: (editor)->
      do stomp.clear

  window.goto = (page)->
    $.get("./docs/#{page}.coffee").then (res)->
      url = "#{location.origin}#{location.pathname}\##{page}"
      window.history.pushState null, null, url
      editor.setValue res
      editor.gotoLine 0

  window.reload = -> location.reload()

  $(window).on 'hashchange', gotoHash = ->
    hash = location.hash.substr 1
    if hash != ''
      goto hash
    else
      goto 'index'

  do gotoHash

  stomp.require "SinOsc"
  do stomp.play
