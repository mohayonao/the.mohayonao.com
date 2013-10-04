$ ->
  'use strict'

  window.requestAnimationFrame ?= window.webkitRequestAnimationFrame \
                               ?  window.mozRequestAnimationFrame    \
                               ?  window.oRequestAnimationFrame      \
                               ?  window.msRequestAnimationFrame     \
                               ?  (f)->setTimeout(f, 1000/60)
  
  ua = navigator.userAgent
  
  apps = window.apps = {}
  
  apps.name = (/^(\/[-\w]+\/)/.exec location.pathname)?[1]  
  apps.isPhone  = /(iPhone|iPod|Android)/i.test navigator.userAgent
  apps.isTablet = /(iPad|Android)/i.test navigator.userAgent
  apps.isDesktop = not (apps.isPhone or apps.isTablet)
  apps.isMobile  = not apps.isDesktop
  apps.isMouseDevice = apps.isDesktop
  apps.isTouchDevice = not apps.isDesktop
  apps.tweet = (opts)->
    w = 550
    h = 250
    l = Math.round (screen.width  - w) * 0.5
    t = Math.round (screen.height - h) * 0.5
    url = "https://twitter.com/share?#{$.param(opts)}"
    features = "width=#{w},height=#{h},left=#{l},top=#{t}"
    window.open url, 'intent', features

  apps.param = $.param
  apps.deparam = (str)->
    obj = {}    
    for x in str.split '&'
      items = x.split '='
      key = decodeURIComponent items[0]
      if items.length is 1
        obj[key] = true
      else
        obj[key] = decodeURIComponent items[1]
    obj

  apps.animate = (opts)->
    func = arguments[arguments.length-1]
    ifps = 1000 / (opts.fps ? 60)

    prev = 0
    _animate = (now)->
      dt = now - prev
      if dt > ifps
        result = func(now, dt)
        prev = now
      if result != false
        requestAnimationFrame _animate
    requestAnimationFrame _animate
    
  $sidebar = $('#sidebar')

  switch
    when apps.isMouseDevice
      $('li', $sidebar).each (i, elem)->
        $li = $(elem)
        media = $li.attr 'data-media'
        if media is 'tablet' or media is 'phone'
          return $li.remove()
      
    when apps.isTablet
      $('li', $sidebar).each (i, elem)->
        $li = $(elem)
        media = $li.attr 'data-media'
        if media is 'desktop' or media is 'phone'
          return $li.remove()

    when apps.isPhone
      $('li', $sidebar).each (i, elem)->
        $li = $(elem)
        media = $li.attr 'data-media'
        
        if media is 'desktop' or media is 'tablet'
          return $li.remove()
