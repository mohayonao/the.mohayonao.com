$ ->
  'use strict'

  canvas  = document.getElementById 'canvas'
  canvas.width  = 640
  canvas.height = 640

  context = canvas.getContext '2d'

  circle = (x, y, r)->
    context.beginPath()
    context.arc x, y, r, 0, Math.PI * 2, true
    context.closePath()
    context.stroke()

  reqId = 0
  queue = []

  animate = ->
    for i in [0..256]
      f = queue.pop()
      if _.isFunction f
        f()
      else if _.isArray f
        [ x, y, r, sr, br, n ] = f
        in_circle x, y, r, sr, br, n

    if queue.length isnt 0
      reqId = requestAnimationFrame animate

  in_circle = (x, y, r, sr, br, n)->
    if --n < 0 or r < 2 then return

    circle 320 + x, 320 - y, r

    do (x, y, r, sr, br, n)->
      queue.push ->
        th = Math.PI * 2.0 / br
        for k in [0...br] by 1
          nr = r / sr
          nx = nr * (sr - 1.0) * Math.cos(th * k) + x
          ny = nr * (sr - 1.0) * Math.sin(th * k) + y
          queue.push [ nx, ny, nr, sr, br, n - 1 ]

  linlin = (num, inMin, inMax, outMin, outMax)->
    (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin

  linexp = (num, inMin, inMax, outMin, outMax)->
    Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin

  hsv2rgb = (h, s, v)->
    r = g = b = v

    if s isnt 0.0
      h = h * 6
      f = h - (h|0)

      switch h|0
        when 0
          g *= 1 - s * (1 - f)
          b *= 1 - s
        when 1
          r *= 1 - s * f
          b *= 1 - s
        when 2
          r *= 1 - s
          b *= 1 - s * (1 - f)
        when 3
          r *= 1 - s
          g *= 1 - s * f
        when 4
          r *= 1 - s * (1 - f)
          g *= 1 - s
        when 5
          g *= 1 - s
          b *= 1 - s * f

    [ r, g, b ].map (x)-> Math.round(x * 255)

  update = ->
    cancelAnimationFrame reqId

    context.clearRect 0, 0, canvas.width, canvas.height

    sr = Math.max(1, Math.min($('#sr').val(), 100))
    br = Math.max(1, Math.min($('#br').val(), 100))
    n  = Math.max(2, Math.min($('#n' ).val(),  12))
    h  = Math.max(1, Math.min($('#h' ).val(), 100))

    sr = linexp sr, 100, 1, 1.0, 10.0
    h  = linlin h , 0, 100, 0, 1.0
    context.strokeStyle = "rgb(" + hsv2rgb(h, 0.5, 0.8).join(',') + ")"

    queue = [ [ 0, 0, 300, sr, br, n ] ]
    reqId = requestAnimationFrame animate

  update()

  $('#sr').on 'input', update
  $('#br').on 'input', update
  $('#n' ).on 'input', update
  $('#h' ).on 'input', update
