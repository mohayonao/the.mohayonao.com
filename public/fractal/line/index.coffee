$ ->
  'use strict'

  SIZE      = 13
  MAX_DEPTH = 65536 * 16
  IF    = (cond, trueCase, falseCase)-> if cond then trueCase else falseCase
  P2A   = (point)-> [ point.x, point.y ]
  P2S   = (point)-> P2A(point).map((ch)-> String.fromCharCode(ch + 65)).join ''
  EQ    = (p1, p2)-> p1 and p2 and p1.x is p2.x and p1.y is p2.y
  DISTANCE = (p1, p2)-> Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))

  RADIUS = 16
  COORD = (num)-> num * 34 + 16 + 20

  if window.innerWidth <= 320
    RADIUS = 8
    COORD = (num)-> num * 17 +  8 + 10

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

  explin = (num, inMin, inMax, outMin, outMax)->
    (((Math.log(num / inMin)) / (Math.log(inMax / inMin))) * (outMax - outMin)) + outMin

  expexp = (num, inMin, inMax, outMin, outMax)->
    Math.pow(outMax / outMin, Math.log(num / inMin) / Math.log(inMax / inMin)) * outMin

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
      context.clearRect 0, 0, @width, @height
      @reqId = 0
      @stack = []

    generate: (path, n)->
      size = SIZE - 1
      centerY = _.first(path)[1]

      @vtx = _.rest(path).map (point)->
        x: (point[0] / size), y: (point[1] - centerY) / size
      @br = @vtx.length

      y  = centerY / 12 * 600 + 40
      sp = x:  20, y: y
      ep = x: 620, y: y

      m = Math.log(MAX_DEPTH) / Math.log(@br)
      n = Math.max(1, Math.floor(m * n * 0.01))

      lineWidth = expexp(Math.pow(@br, n), MAX_DEPTH, 1, 0.05, 256)
      @context.lineWidth = lineWidth
      @context.lineJoin  = "bevel"

      if lineWidth >= 2
        @context.beginPath()
        @context.moveTo(sp.x, sp.y)
        @drawFunc = (sp, ep)=>
          @context.lineTo(ep.x, ep.y)
        @nextFunc = (params)=>
          draw.call @, params
        @nextFunc [ sp, ep, n ]
        @context.stroke()
      else
        @drawFunc = (sp, ep)=>
          @context.beginPath()
          @context.moveTo(sp.x, sp.y)
          @context.lineTo(ep.x, ep.y)
          @context.stroke()
        @nextFunc = (params)=>
          @stack.push params
        @stack = [ [ sp, ep, n ] ]
        @reqId = requestAnimationFrame => do @animate

    animate: ->
      for i in [0...256]
        break if @stack.length is 0

        draw.call @, @.stack.pop()

      if @stack.length isnt 0
        @reqId = requestAnimationFrame => do @animate

    draw = ([ sp, ep, n ])->
      if --n < 0 or DISTANCE(sp, ep) < 0.5
        @drawFunc sp, ep
        return

      pp = { x: sp.x, y: sp.y }

      @vtx.forEach (vptr)=>
        cp =
          x: vptr.x * (ep.x - sp.x) - vptr.y * (ep.y - sp.y) + sp.x
          y: vptr.x * (ep.y - sp.y) + vptr.y * (ep.x - sp.x) + sp.y

        @nextFunc [ pp, cp, n ]

        pp = { x: cp.x, y: cp.y }


  renderer = new Renderer(context, canvas.width, canvas.height)

  Vue.component 'editor',
    template: '#editor-template'

    replace: true

    components:
      point:
        data: { r: RADIUS }
        computed:
          cx: -> COORD(@x)
          cy: -> COORD(@y)
        methods:
          select: -> @$root.select @$data
          state : -> @$root.state  @$data

  vue = new Vue
    el: '#app'

    data:
      width : renderer.width
      height: renderer.height
      path: [
        { x:  0, y: 8 }
        { x:  4, y: 8 }
        { x:  4, y: 4 }
        { x:  8, y: 4 }
        { x:  8, y: 8 }
        { x: 12, y: 8 }
      ]
      params: [
        { name: 'n', value: 75 }
        { name: 'h', value: 60 }
      ]
      points: _.range(SIZE * SIZE).map (i)->
        i:i, x:Math.floor(i % SIZE), y:Math.floor(i / SIZE)
      selected: []

    computed:
      svg_points: ->
        _.flatten(@selected.map(P2A)).map(COORD).join ','

    methods:
      select: (point)->
        if not @isTooMany() and not @isSelected(point) and not @isFinished()
          if @selected.length is 0 and point.x isnt 0
            return
          if @selected.length <= 1 and EQ(point, @getGoalPoint())
            return
          @selected.push point

      state: (point)->
        if @isEmpty()
          IF(point.x is 0, 'enabled', 'disabled')
        else if @isSelected(point)
          'selected'
        else if @isTooMany()
          'disabled'
        else if EQ(point, @getGoalPoint())
          'goal'
        else if @isFinished()
          'disabled'
        else
          'enabled'

      isEmpty: ->
        @selected.length is 0

      isSelected: (p1)->
        @selected.some((p2)=> EQ(p1, p2))

      isTooMany: ->
        false

      isFinished: ->
        @selected.length >= 3 and EQ(@getGoalPoint(), _.last @selected)

      getGoalPoint: ->
        if @selected.length isnt 0
          @points[(@selected[0].y + 1) * SIZE - 1]

      edit: ->
        @selected = @path.slice()
        $('#editor').modal('show')

      clear: ->
        @selected = []

      undo: ->
        if @selected.length
          point = @selected.pop()
          @goaled = false

      ok: ->
        $('#editor').modal('hide').one 'hidden.bs.modal', =>
          if @selected.length >= 3
            @path = @selected.map (point)-> _.pick(point, 'x', 'y')
            @update()

      update: _.debounce(->
        window.location.replace "#" + vue._hash()

        [ n, h ] = _.pluck vue.params, 'value'

        h   = linlin h, 1, 100, 0, 360
        hsv = Color( h:h, s:80, v:75 )

        renderer.init 0.25, hsv.rgbString()
        renderer.generate vue.path.map(P2A), n
      , 150)

      tweet: ->
        text = utils.lang
          ja: '線'
          '': document.title
        utils.tweet text:text, url:window.location.href

      _hash: ->
        [ @path.map(P2S).join('') ].concat(_.pluck @params, 'value').join ','

  if window.location.hash
    hash  = decodeURIComponent(window.location.hash.substr 1)
    items = hash.split ','

    path = items.shift()
    if /^A([A-M])([A-M][A-M])+M\1$/.test(path)
      vue.path = path.match(/../g).map (xy)->
        x = clip xy.charCodeAt(0) - 65, 0, 12
        y = clip xy.charCodeAt(1) - 65, 0, 12
        x:x, y: y
    vue.params.forEach (param, i)->
      param.value = clip items[i]|0, 1, 100

  vue.update()
