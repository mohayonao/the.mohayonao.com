$ ->
  'use strict'

  $(window).on 'dragover', ->
    false
  
  $(window).on 'drop', (e)->
    main e.originalEvent.dataTransfer.files[0]
    false

  editor = ace.edit 'editor'
  editor.setTheme 'ace/theme/monokai'
  editor.setPrintMarginColumn -1
  editor.getSession().setTabSize 2
  editor.getSession().setMode 'ace/mode/json'

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
      values = ( @float32() for i in [0...num] by 1 )
      names  = []
      names.push @text(), @int32() for i in [0...@int32()] by 1
      values:values, names:names

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

  tab = (n)-> (" " for i in [0...n]).join ""
  val = (x)-> if typeof x is "string" then '"'+x+'"' else x
  spec = (spec)->
    items = []
    items.push val(spec[0]), spec[1], spec[2]
    items.push "[ #{spec[3].join ', ' } ]"
    items.push "[ #{spec[4].join ', ' } ]"
    items.join ", "

  pp = (json)->
    str = []
    str.push "{"
    str.push tab(2) + "'version': #{json.version},"
    str.push tab(2) + "'defs': ["
    for i in [0...json.defs.length] by 1
      def = json.defs[i]
      str.push tab(4) + "{"
      str.push tab(6) + "'name': '#{def.name}',"
      str.push tab(6) + "'consts': [ #{ def.consts.join ', ' } ],"
      str.push tab(6) + "'params': {"
      str.push tab(8) + "'values': [ #{ def.params.values.join ', ' } ],"
      str.push tab(8) + "'names': [ #{ def.params.names.map(val).join ', ' } ]"
      str.push tab(6) + "},"
      str.push tab(6) + "'specs': ["
      for j in [0...def.specs.length] by 1
        comma = if j < def.specs.length - 1 then "," else ""
        str.push tab(8) + "[ #{ spec def.specs[j] } ]" + comma
      str.push tab(6) + "],"
      str.push tab(6) + "'variants': {"
      keys = Object.keys(def.variants)
      for j in [0...keys.length] by 1
        comma = if j < keys.length - 1 then "," else ""
        str.push tab(8) + "'#{keys[j]}': [ #{ def.variants[keys[j]].map(val).join ', ' } ]" + comma
      str.push tab(6) + "}"
      comma = if i < json.defs.length - 1 then "," else ""
      str.push tab(4) + "}" + comma
    str.push tab(2) + "]"
    str.push "}"
    str.join("\n").replace(/\'/g, '"').replace /\[  \]/g, '[]'

  main = (file)->
    reader = new FileReader
    reader.onload = (e)->
      json = new SynthDefParser().toJSON new Uint8Array(e.target.result)
      if json
        editor.setValue pp json
        editor.clearSelection()      
    reader.readAsArrayBuffer file
