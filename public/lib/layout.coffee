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

  apps.animate = (func)->
    prev = 0
    _animate = (now)->
      result = func(now, now - prev)
      prev = now
      if result != false
        requestAnimationFrame _animate
    requestAnimationFrame _animate

  stats = new Stats
  apps.stats = (func)->
    stats.domElement.style.position = 'absolute'
    stats.domElement.style.right    = '0px'
    stats.domElement.style.top      = '0px'
    document.body.appendChild stats.domElement

    apps.stats = (func)->
      stats.begin()
      do func
      stats.end()
    do func
    
  $sidebar  = $('#sidebar')
  $appimage = $('#appimage')
    
  if apps.isMouseDevice
    show_app_image = do ->
      $origin = $('img', $appimage)
      func = (name)->
        $appimage.empty().append show_app_image[name] ? $origin[0]
      func['default'] = $($origin[1]).remove().show()
      func

    $('li', $sidebar).each (i, elem)->
      $li = $(elem)
      media = $li.attr 'data-media'
      
      if media is 'tablet' or media is 'phone'
        return $li.remove()
      
      $img = $('img', $li).remove().show()
      url  = $('a', $li).attr 'href'
      show_app_image[url] = $img
      if apps.name is url
        $li.css 'list-style-image', 'url("/lib/list-style.gif")'
      $li.on 'mouseover', ->
        show_app_image url

    $('ul', $sidebar).on 'mouseout', ->
      show_app_image null

    $('h1', $sidebar).on 'mouseout', ->
      show_app_image null

    $('h1', $sidebar).on 'mouseover', ->
      show_app_image 'default'
      
  else if apps.isTablet
  
    $('li', $sidebar).each (i, elem)->
      $li = $(elem)
      media = $li.attr 'data-media'
      
      if media is 'desktop' or media is 'phone'
        return $li.remove()

  else if apps.isPhone
    
    $('#sidebar').hide()
    $('#content').css('margin-left':'0')
  
    $appimage.empty()
    
    $('li', $sidebar).each (i, elem)->
      $li = $(elem)
      media = $li.attr 'data-media'
      
      if media is 'desktop' or media is 'tablet'
        return $li.remove()

        $('img', $li).css(display:'block',width:'90px',height:'90px').show()
