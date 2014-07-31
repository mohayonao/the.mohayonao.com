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

  class Application
    constructor: (@context, @width, @height)->
      @reqId = 0
      @stack = []

    init: (width, color)->
      @clear()
      @context.lineWidth   = width
      @context.strokeStyle = color

    clear: ->
      cancelAnimationFrame @reqId
      context.clearRect 0, 0, @.width, @height
      @reqId = 0
      @stack = []

    generate: (x, y, r, sr, br, n)->
      @stack = [ [ next, x, y, r, sr, br, n ] ]
      @reqId = requestAnimationFrame => animate.call(@)

    circle = (context, x, y, r)->
      context.beginPath()
      context.arc x, y, r, 0, Math.PI * 2, true
      context.closePath()
      context.stroke()

    animate = ->
      for i in [0..256]
        break if @stack.length is 0

        items = @stack.pop()
        func  = _.first(items)
        func.apply @, _.rest(items)

      if @stack.length isnt 0
        @reqId = requestAnimationFrame => animate.call(@)

    next = (x, y, r, sr, br, n)->
      circle @context, @width * 0.5 + x, @height * 0.5 - y, r

      nr = r / sr
      if n > 1 and nr > 2
        func = (x, y, nr, sr, br, n)=>
          th = Math.PI * 2.0 / br
          for k in [0...br] by 1
            nx = nr * (sr - 1.0) * Math.cos(th * k) + x
            ny = nr * (sr - 1.0) * Math.sin(th * k) + y
            @stack.push [ next, nx, ny, nr, sr, br, n - 1 ]
        @stack.push [ func, x, y, nr, sr, br, n ]

  app = new Application(context, canvas.width, canvas.height)

  vue = new Vue
    el: '#app'

    data:
      width : app.width
      height: app.height
      params: [
        { label: 'sr', value: 64 }
        { label: 'br', value: 36 }
        { label: 'n' , value:  5 }
        { label: 'h' , value:  1 }
      ]

    methods:
      update: ->
        [ sr, br, n, h ] = vue.getParams()

        hsv = color.hsv2rgb h, 0.5, 0.8

        app.init 0.2, "rgb(" + hsv.join(',') + ")"
        app.generate 0, 0, 300, sr, br, n

      getParams: ->
        sr = clip @params[0].value, 1, 100
        br = clip @params[1].value, 1, 100
        n  = clip @params[2].value, 1, 100
        h  = clip @params[3].value, 1, 100

        window.location.replace "#" + [ sr, br, n, h ].join(',')

        sr = linexp(sr, 100, 1, 1.0, 10.0)
        br = br|0
        n  = linlin(n , 1, 100, 2, 24)|0
        h  = linlin(h , 1, 100, 0, 360)

        [ sr, br, n, h ]

  if window.location.hash
    hash = decodeURIComponent(window.location.hash.substr(1))
    items = hash.split ','
    vue.params[0].value = (items[0]|0)
    vue.params[1].value = (items[1]|0)
    vue.params[2].value = (items[2]|0)
    vue.params[3].value = (items[3]|0)

  vue.update()
