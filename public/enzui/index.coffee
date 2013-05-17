$ ->
  'use strict'

  id     = 'enzui'
  width  = 550
  height = 400
  source = '''
# patch[0]
$XY=0,0
$ZOOM=1
[_01 -220,-160,20,20 button]

[_02 -120,-100,80,20 delay 50]
[_05 -220,-60,80,20 number 987.7666025122483]
[_06 -120,-60,80,20 number 1318.5102276514797]
(_01:1->1:_05)
(_01:1->1:_02)
(_02:1->1:_06)

[_10 -220,0,80,20 rect~]
(_05:1->1:_10)
(_06:1->1:_10)

[_11 -220,40,80,20 *~ 0.3]
(_10:1->1:_11)

[_20 -120,-25,80,20 message 1,0.0 1000]
[_21 -120,0,80,20 line~]
(_01:1->1:_20)
(_20:1->1:_21)
(_21:1->2:_11)

[_99 -220,80,60,20 dac~]
(_11:1->1:_99)
(_11:1->2:_99)
__END__
'''  

  enz = enzui pico

  opt = target:id, width:width, height:height, source:source
  patcher = enz.newPatcherWindow id, opt

  do enz.start

  source += '\n' + $('#desc').text()

  $('#load').on 'click', ->
    src = $('#src').val().trim()
    if src
      dfd = $.get("src/#{src}.enz")
    else
      dfd = $.Deferred()
      dfd.resolve source

    dfd.then (result)->
      index = result.indexOf '__END__'
      if index != -1
        src = result.substr(0, index).trim()
        doc = result.substr(index + 7).trim()
      else
        src = result.trim()
        doc = ''
      patcher.stop()
      patcher.execute src
      doc = doc.replace /\n/g, '<br/>'
      $('#desc').html doc
