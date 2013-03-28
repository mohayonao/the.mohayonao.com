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
    console.log url
    window.open url, 'intent', features
        
  $sidebar  = $('#sidebar')
  $appimage = $('#appimage')
    
  if apps.isMouseDevice
    show_app_image = do ->
      $origin = $('img', $appimage)
      (name)->
        $appimage.empty().append show_app_image[name] ? $origin

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
      show_app_image null
      
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
