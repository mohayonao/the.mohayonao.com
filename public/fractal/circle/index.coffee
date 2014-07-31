$ ->
  'use strict'

  canvas  = document.getElementById 'canvas'
  canvas.width  = 640
  canvas.height = 640

  context = canvas.getContext '2d'

  clip = (num, min, max)->
    Math.max(min, Math.min(num, max))

  linlin = (num, inMin, inMax, outMin, outMax)->
    (num - inMin) / (inMax - inMin) * (outMax - outMin) + outMin

  linexp = (num, inMin, inMax, outMin, outMax)->
    Math.pow(outMax / outMin, (num - inMin) / (inMax - inMin)) * outMin

  class Renderer
    constructor: (@context, @width, @height)->
      @reqId = 0
      @stack = []

    init: (lineWidth, color)->
      @clear()
      @context.lineWidth   = lineWidth
      @context.strokeStyle = color

    clear: ->
      cancelAnimationFrame @reqId
      context.clearRect 0, 0, @.width, @height
      @reqId = 0
      @stack = []

    generate: (x, y, r, sr, br, n)->
      sr = linexp(sr, 100, 1, 1, 8.0)
      br = linlin(br, 1, 100, 1, 100)|0
      n  = linlin(n , 1, 100, 2,  12)|0

      @stack = [ [ next, x, y, r, sr, br, n ] ]
      @reqId = requestAnimationFrame => do @animate

    animate: ->
      for i in [0..256]
        break if @stack.length is 0

        items = @stack.pop()
        func  = _.first items
        func.apply @, _.rest items

      if @stack.length isnt 0
        @reqId = requestAnimationFrame => do @animate

    circle = (context, x, y, r)->
      context.beginPath()
      context.arc(x, y, r, 0, Math.PI * 2, true)
      context.closePath()
      context.stroke()

    next = (x, y, r, sr, br, n)->
      circle @context, @width * 0.5 + x, @height * 0.5 - y, r

      nr = r / sr
      if n > 1 and nr > 1
        func = (x, y, nr, sr, br, n)=>
          th = Math.PI * 2.0 / br
          for k in [0...br] by 1
            nx = nr * (sr - 1.0) * Math.cos(th * k) + x
            ny = nr * (sr - 1.0) * Math.sin(th * k) + y
            @stack.push [ next, nx, ny, nr, sr, br, n - 1 ]
          null
        @stack.push [ func, x, y, nr, sr, br, n ]

  renderer = new Renderer(context, canvas.width, canvas.height)

  vue = new Vue
    el: '#app'

    data:
      width : renderer.width
      height: renderer.height
      params: [
        { label: 'sr', value: 64 }
        { label: 'br', value: 36 }
        { label: 'n' , value:  5 }
        { label: 'h' , value:  1 }
      ]

    methods:
      update: ->
        params = _.pluck @params, 'value'
        window.location.replace "#" + params.join ','

        [ sr, br, n, h ] = params

        h   = linlin h, 1, 100, 0, 360
        hsv = Color( h:h, s:80, v:60 )

        renderer.init 0.2, hsv.rgbString()
        renderer.generate 0, 0, 300, sr, br, n

      tweet: ->
        text = document.title
        apps.tweet text:text, url:window.location.href

  if window.location.hash
    hash = decodeURIComponent(window.location.hash.substr 1)
    items = hash.split ','
    vue.params.forEach (param, i)->
      param.value = clip items[i]|0, 1, 100

  vue.update()
