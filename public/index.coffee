$ ->
  'use strict'
  
  if apps.isPhone
    $('#sidebar').show().css(width:'100%').appendTo $('#content').empty()
