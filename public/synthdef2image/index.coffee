$ ->
  'use strict'
  
  $(window).on 'dragover', ->
    false
  
  $(window).on 'drop', (e)->
    main e.originalEvent.dataTransfer.files[0]
    false

  class SynthDefParser
    constructor: (@file)->
      @index = 0
    
    byte: ->
      @file[@index++]

    int8: ->
      @file[@index++]

    int16: ->
      (@file[@index++]<<8) + @file[@index++]

    int32: ->
      (@file[@index++]<<24) + (@file[@index++]<<16) + (@file[@index++]<<8) + @file[@index++]

    float32: ->
      new Float32Array(new Int32Array([@int32()]).buffer)[0]

    text: ->
      len = @file[@index++]
      String.fromCharCode.apply null, (@file[@index++] for i in [0...len] by 1)

    toJSON: (@file)->
      @index = 0
      header = (String.fromCharCode @byte()  for i in [0..3]).join("")
      return null if header isnt "SCgf"
      version = @int32()
      return null if version isnt 2
      version:version, defs: readDefListJSON.call @

    readDefListJSON = ->
      readDefJSON.call @ for i in [0...@int16()] by 1

    readDefJSON = ->
      obj =
        name: @text()
        consts: ( @float32() for i in [0...@int32()] by 1 )
      p = @int32()
      obj.params = readParamsJSON.call @, p
      u = @int32()
      obj.specs = readSpecListJSON.call @, u
      obj.variants = readVariants.call @, p
      obj

    readParamsJSON = (num)->
      values  = ( @float32() for i in [0...num] by 1 )
      indices = []
      names   = []
      for i in [0...@int32()] by 1
        names.push   @text()
        indices.push @int32() 
      names:names, indices:indices, values:values

    readSpecListJSON = (num)->
      readSpecJSON.call @ for i in [0...num] by 1
        
    readSpecJSON = ->
      name = @text()
      rate = @int8()
      input_len  = @int32()
      output_len = @int32()
      specialIndex = @int16()
      inputs = []
      inputs.push @int32(), @int32() for i in [0...input_len] by 1
      outputs = []
      outputs.push @int8() for i in [0...output_len] by 1
      [ name, rate, specialIndex, inputs, outputs ]    

    readVariants = (num)->
      list = {}
      for i in [0...@int16()] by 1
        list[@text()] = [ @float32() for j in [0...num] by 1 ]
      list

  UnaryOpUGenMap = '
  neg not isnil notnil bitnot abs asfloat asint ceil floor frac sign squared cubed sqrt exp recip midicps cpsmidi midiratio ratiomidi dbamp ampdb octcps cpsoct log log2 log10 sin cos tan arcsin arccos arctan sinh cosh tanh rand rand2 linrand bilinrand sum3rand distort softclip coin digitvalue silence thru rectwindow hanwindow welchwindow triwindow ramp scurve numunaryselectors'.split ' '
  BinaryOpUGenMap = '+ - * / / % == != < > <= >= min max & | ^ lcm gcd round roundUp trunc atan2 hypot hypotx pow << >> >>> fill ring1 ring2 ring3 ring4 difsqr sumsqr sqrsum sqrdif absdif thresh amclip scaleneg clip2 excess fold2 wrap2 firstarg randrange exprandrange numbinaryselectors'.split ' '

  class Inlet
    constructor: (@parent, @index)->
      @from = []
      @to   = []
      
    getX: ->
      offset = (@index * (@parent.width / (@parent.inlets.length - 1)))|0
      Math.ceil @parent.getX() + offset

    getY: ->
      Math.ceil @parent.getY()

    render: (context)->
      x = @getX()
      y = @getY()
      context.beginPath()
      context.arc x, y, 3, 0, Math.PI * 2, true
      context.closePath()
      context.fill()

  class Outlet extends Inlet
    getX: ->
      offset = (@index * (@parent.width / (@parent.outlets.length - 1)))|0
      Math.ceil @parent.getX() + offset
    getY: ->
      Math.ceil @parent.getY() + @parent.height
    render: (context)->
      super context
      if @to
        [ x1, y1 ] = [ @getX(), @getY() ]
        for inlet in @to
          [ x2, y2 ] = [ inlet.getX(), inlet.getY() ]
          @bezierline context, x1, y1, x2, y2
    bezierline: (context, x1, y1, x2, y2)->
      cp1x = x1
      cp1y = y2 - 15
      cp2x = x2
      cp2y = y1 + (y2 - y1) * 0.5
      context.beginPath()
      context.moveTo x1, y1
      context.bezierCurveTo cp1x, cp1y, cp2x, cp2y, x2, y2
      context.stroke()
      context.closePath()

  class Box
    constructor: (@context, @index, @spec, @x=0, @y=0)->
      { @name, @rate, @spId, @inputs, @outputs } = @spec
      @name = @name.replace /^\d+_(.+)$/, '$1'
      if @name is 'UnaryOpUGen'
        @name = UnaryOpUGenMap[@spId]
      else if @name is 'BinaryOpUGen'
        @name = BinaryOpUGenMap[@spId]
      @width = do =>
        m = @context.measureText @name
        w = Math.ceil(m.width * 0.1) * 10 + 10
        if @rate isnt 0
          w = Math.max w, Math.max(@inputs.length, @outputs.length) * 15
        Math.max 30, w
      @height = 20
      @inlets  = ( new Inlet(@, i)  for i in [0...@inputs .length>>1] by 1 )
      @outlets = ( new Outlet(@, i) for i in [0...@outputs.length   ] by 1 )

    adjust: (val)-> val # (val|0) + 0.5
    getX: -> @adjust @x
    getY: -> @adjust @y

    render: (context)->
      context.save()
      x = @getX()
      y = @getY()
      switch @rate
        when 0
          context.fillStyle = '#e0e0e0'
          context.fillRect x, y, @width, @height
        when 1
          context.fillStyle = '#d0d0f0'
          context.fillRect x, y, @width, @height
        when 2
          context.fillStyle = '#f0c0c0'
          context.fillRect x, y, @width, @height
      context.fillStyle = '#333'
      context.strokeRect x, y, @width, @height
      context.fillText @name, x + 5, y + @height - 5, @width
      @inlets .forEach (inlet )-> inlet .render context
      @outlets.forEach (outlet)-> outlet.render context
      context.restore()

  class SynthDefRenderer
    toDataURL: (json)->
      @build json
      @canvas.width  = @width
      @canvas.height = @height
      @context.font = '12pt normal'
      @context.strokeStyle = '#333'
      @context.lineWidth   = 2
      @context.fillStyle   = '#fff'
      @context.fillRect 0, 0, @width, @height
      @context.fillStyle   = '#333'
      for x in @builded
        for {name, boxList, x, y} in @builded
          @context.fillText name, x, y + 15
          box.render(@context) for box in boxList
      @canvas.toDataURL 'image/png'

    build: (json)->
      @canvas = document.createElement 'canvas'
      @context = @canvas.getContext '2d'
      @context.font = '12pt normal'
      maxX = maxY = 0
      @builded = for def in json.defs
        x = maxX + 20
        y = 10
        specList = remakeSpecList def
        boxList  = makeBoxList @context, specList
        boxList  = layout boxList, x, y + 20
        boxList.forEach (box)->
          maxX = Math.max maxX, box.getX() + box.width
          maxY = Math.max maxY, box.getY() + box.height
        name:def.name, boxList:boxList, x:x, y:y
      @width  = maxX + 10
      @height = maxY + 10
    
    remakeSpecList = (def)->
      specList = []
      argName = do ->
        index = 0
        a = for i in [0...def.params.values.length] by 1
          if def.params.indices[index+1] is i
            index += 1
          def.params.names[index]
        '0_' + a.join ', '
      if argName isnt '0_'
        specList.push
          name: argName
          rate: -1, spId:0, inputs:[], outputs: (1 for _ in def.params.values)
      def.consts = def.consts.map (x)-> +x.toFixed 5
      origin = for [ name, rate, spId, inputs, outputs ], i in def.specs
        name:"#{i}_#{name}", rate:rate, spId:spId, inputs:inputs, outputs:outputs
      numId = origin.length
      for spec in origin
        if /Control$/.test spec.name
          for i in [0...spec.outputs.length] by 1
            spec.inputs.push argName, spec.spId + i
        for i in [0...spec.inputs.length] by 2
          if spec.inputs[i] is argName
            continue
          if spec.inputs[i] isnt -1
            spec.inputs[i] = origin[spec.inputs[i]].name
          else
            numSpec =
              name:"#{numId++}_#{def.consts[spec.inputs[i+1]]}"
              rate:0, spId:0, inputs:[], outputs:[1]
            specList.push numSpec
            spec.inputs[i]   = numSpec.name
            spec.inputs[i+1] = 0
        specList.push spec
      specList

    makeBoxList = (context, specList)->
      map = {}
      boxList = for spec, index in specList
        spec.box = map[spec.name] = new Box(context, index, spec)
      for box in boxList
        for i in [0...box.inputs.length>>1] by 1
          fromName  = box.inputs[i*2]
          fromIndex = box.inputs[i*2+1]
          fromOutlet = map[fromName].outlets[fromIndex]
          box.inlets[i].from.push fromOutlet
          fromOutlet.to.push box.inlets[i]
      boxList

    layout = (boxList, offsetX, offsetY)->
      boxList = layoutY boxList
      boxList = layoutX boxList
      for box in boxList
        box.x += offsetX
        box.y += offsetY
      boxList

    layoutY = (boxList)->
      walkOut = (box, y=10)->
        box.y = Math.max(y, box.y)
        box.outlets.forEach (outlet)->
          outlet.to.forEach (inlet)->
            walkOut inlet.parent, box.y + 50
      walkOut boxList[0]
      walkIn = (box, y=10)->
        if box.y is 0
          box.y = Math.max(y, box.y)
        box.inlets.forEach (inlet)->
          inlet.from.forEach (outlet)->
            walkIn outlet.parent, box.y - 50
      walkIn boxList[boxList.length-1]
      walkRemain = (box, y=10)->
        box.y = y
        box.outlets.forEach (outlet)->
          outlet.to.forEach (inlet)-> walkRemain inlet.parent, y + 50
      for box in boxList
        if box.y is 0
          walkRemain box
      boxList
    
    layoutX = (boxList)->
      map = {}
      for box in boxList
        unless map[box.y] then map[box.y] = []
        map[box.y].push box
      for key in Object.keys(map).reverse()
        list = map[key]
        for box in list
          box.maxOutX = box.outlets.reduce (a, outlet)->
            Math.max a, outlet.to.reduce (a, inlet)->
              Math.max a, inlet.getX()
            , 0
          , 0
        list.sort (a, b)-> a.maxOutX - b.maxOutX
        for i in [1...list.length] by 1
          prev = list[i-1]
          list[i].x = prev.getX() + prev.width + 10
          prev.next = list[i]
      boxList

  render = (data)->
    json = new SynthDefParser().toJSON data
    if json
      renderer = new SynthDefRenderer
      $('#result').attr src:renderer.toDataURL json

  main = (file)->
    reader = new FileReader
    reader.onload = (e)->
      render new Uint8Array(e.target.result)
    reader.readAsArrayBuffer file

  xhr = new XMLHttpRequest
  xhr.open 'GET', './default.scsyndef'
  xhr.responseType = 'arraybuffer'
  xhr.onreadystatechange = ->
    if xhr.readyState is 4
      if xhr.response
        render new Uint8Array(xhr.response)
  xhr.send()
