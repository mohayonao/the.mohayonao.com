$ ->
  'use strict'

  sc.use 'global'

  editor = ace.edit 'editor'
  editor.setTheme 'ace/theme/monokai'
  editor.setPrintMarginColumn -1
  editor.getSession().setTabSize 2
  editor.getSession().setMode 'ace/mode/coffee'
  editor.setSelectionStyle 'text'
  editor.focus()

  cache = {}
  getCssRule = (selector)->
    return cache[selector] if cache[selector]

    sheets = [].slice.call(document.styleSheets).reverse()
    for sheet in sheets
      rules = [].slice.call(sheet.cssRules ? sheet.rules).reverse()
      for rule in rules
        if rule.selectorText.indexOf(selector) != -1
          cache[selector] = rule
          return rule
    return null

  blink = (selector)->
    rule = getCssRule selector
    return unless rule
    if not rule.savedBackground
      rule.savedBackground = rule.style.getPropertyValue 'background'
    savedBackground = rule.savedBackground
    rule.style.setProperty 'background', '#e60033'
    setTimeout ->
      rule.style.setProperty 'background', savedBackground
    , 250

  editor.commands.addCommand
    name: 'play'
    bindKey: 'Ctrl-Enter'
    exec: (editor)->
      sess = editor.session
      code = sess.getTextRange editor.getSelectionRange()
      if code is ''
        code = sess.getLine(editor.getCursorPosition().row)
        blink '.ace_marker-layer .ace_active-line'
      else
        blink '.ace_marker-layer .ace_selection'
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
