$ ->
  'use strict'

  window.requestAnimationFrame ?= window.webkitRequestAnimationFrame \
                               ?  window.mozRequestAnimationFrame    \
                               ?  window.oRequestAnimationFrame      \
                               ?  window.msRequestAnimationFrame     \
                               ?  (f)-> setTimeout(f, 1000/60)

  window.cancelAnimationFrame ?= window.webkitCancelAnimationFrame    \
                              ?  window.mozCancelAnimationFrame       \
                              ?  window.oCancelAnimationFrame         \
                              ?  window.msCancelRequestAnimationFrame \
                              ?  (id)-> clearTimeout(id)

  window.AudioContext ?= window.webkitAudioContext

  window.createObjectURL = (window.URL or window.webkitURL)?.createObjectURL

  utils = window.utils = {}

  utils.getName = ->
    (/^(\/[-\w]+\/)/.exec location.pathname)?[1]

  utils.lang = (data)->
    if data.hasOwnProperty navigator.language
      data = data[navigator.language]
    else
      data = data['']
    if typeof data is 'function'
      data = do data
    if not (typeof data is 'string')
      data = ''
    data

  utils.isPhone  = ->
    /(iPhone|iPod|Android)/i.test navigator.userAgent

  utils.isTablet = ->
    /(iPad|Android)/i.test navigator.userAgent

  utils.isDesktop = ->
    not (utils.isPhone() or utils.isTablet())

  utils.isMobile  = ->
    not utils.isDesktop()

  utils.isMouseDevice = ->
    utils.isDesktop()

  utils.isTouchDevice = ->
    not utils.isDesktop()

  utils.tweet = (opts)->
    w = 550
    h = 420
    l = Math.round (screen.width  - w) * 0.5
    t = Math.round (screen.height - h) * 0.5
    url = "https://twitter.com/intent/tweet?#{$.param(opts)}"
    window.open url, 'intent', "width=#{w},height=#{h},left=#{l},top=#{t}"

  utils.param = $.param

  utils.deparam = (str)->
    obj = {}
    str.split('&').forEach (x)->
      items = x.split '='
      key   = decodeURIComponent items[0]
      if items.length is 1
        obj[key] = true
      else
        obj[key] = decodeURIComponent items[1]
    obj

  utils.animate = (opts)->
    func = arguments[arguments.length-1]
    ifps = 1000 / (opts.fps ? 60)
    prev = 0

    animate = (now)->
      dt = now - prev

      if dt > ifps
        result = func now, dt
        prev   = now

      if result isnt false
        requestAnimationFrame animate

    requestAnimationFrame animate
