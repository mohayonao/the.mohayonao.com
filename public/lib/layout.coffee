$ ->
  'use strict'

  window.requestAnimationFrame ?= window.webkitRequestAnimationFrame \
                               ?  window.mozRequestAnimationFrame    \
                               ?  window.oRequestAnimationFrame      \
                               ?  window.msRequestAnimationFrame     \
                               ?  (f)->setTimeout(f, 1000/60)
  
  ua = navigator.userAgent
  
  apps = window.apps = {}
  apps.isPhone  = /(iPhone|iPod|Android)/i.test navigator.userAgent
  apps.isTablet = /(iPad|Android)/i.test navigator.userAgent
  apps.isDesktop = not (apps.isPhone or apps.isTablet)
  apps.isMouseDevice = apps.isDesktop
  apps.isTouchDevice = not apps.isDesktop
  
  if apps.isMouseDevice
    app_name = (/^(\/[-\w]+\/)/.exec location.pathname)?[1]
    
    $sidebar = $('#sidebar')

    show_app_image = do ->
      $img = $('img', $sidebar)
      (name)->
        $img.attr 'src', show_app_image[name] ? '/appimage.png'

    $('li', $sidebar).each (i, elem)->
      $li = $(elem)
      id  = $li.attr 'id'
      title = $li.attr 'data-title'
      src = if /^https?:/.test id
        "/lib/icon/#{title}.png"
      else
        "#{id}appimage.png"
      $('<img>').attr('src', src).on 'load', ->
        show_app_image[id] = src
      if app_name is id
        $li.css 'list-style-image', 'url("/lib/list-style.gif")'
        
      $li.on 'mouseover', ->
        show_app_image id

    $('ul', $sidebar).on 'mouseout', ->
      show_app_image app_name

    $('h1', $sidebar).on 'mouseout', ->
      show_app_image app_name

    $('h1', $sidebar).on 'mouseover', ->
      show_app_image null
  else if apps.isPhone
    $('#sidebar').hide()
    $('#content').css('margin-left':'0')
