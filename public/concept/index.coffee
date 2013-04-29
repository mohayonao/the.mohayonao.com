$ ->
  'use strict'

  sc.use 'prototype'

  editor = ace.edit 'editor'
  editor.setTheme 'ace/theme/github'
  editor.setPrintMarginColumn -1
  editor.getSession().setTabSize 4
  editor.getSession().setMode 'ace/mode/coffee'
  editor.focus()

  editor.commands.addCommand
    name: 'play'
    bindKey: 'Ctrl-Enter'
    exec: (editor)->
      sess = editor.session
      code = sess.getTextRange editor.getSelectionRange()
      code = sess.getLine(editor.getCursorPosition().row) if code is ''
      try
        eval.call window, CoffeeScript.compile(code, bare:true)
      catch err
        console.warn err

  editor.commands.addCommand
    name: 'stop'
    bindKey: 'Ctrl-.'
    exec: (editor)->
      timbre.reset()
      timbre.pause()

  editor.getSession().selection.on 'changeCursor', (e)->
    localStorage.setItem "#{current}.cursor", JSON.stringify
      pos: editor.getCursorPosition()
      row: editor.getFirstVisibleRow()

  changeFavicon = (mode)->
    $('#favicon').attr href:"#{mode}.gif"
  changeFavicon 'pause'

  timbre.on 'play' , -> changeFavicon 'play'
  timbre.on 'pause', -> changeFavicon 'pause'

  current = null

  window.goto = (page)->
    prev = current
    $.get("./docs/#{page}.coffee").then (res)->
      url = "#{location.origin}#{location.pathname}\##{page}"
      window.history.pushState null, null, url
      editor.setValue res

      obj = localStorage.getItem "#{page}.cursor"
      if obj
        obj = JSON.parse obj
        editor.moveCursorTo obj.row, 0
        editor.moveCursorToPosition obj.pos
      editor.clearSelection()      
      current = page

  window.reload = -> location.reload()

  $(window).on 'hashchange', gotoHash = ->
    hash = location.hash.substr 1
    if hash != ''
      goto hash
    else
      goto 'index'

  do gotoHash
