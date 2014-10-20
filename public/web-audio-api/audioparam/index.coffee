param = null

$ ->
  'use strict'

  SAMPLERATE = 44100
  CONTROL_SAMPLES = 128

  draw = (values, duration, range)->
    canvas = document.getElementById 'canvas'
    context = canvas.getContext '2d'

    clear context, canvas.width, canvas.height
    drawGrid context, canvas.width, canvas.height
    drawValues context, canvas.width, canvas.height, values, range
    drawTime context, canvas.width, canvas.height, duration
    drawrange context, canvas.width, canvas.height, range

  clear = (context, width, height)->
    context.clearRect 0, 0, width, height

  drawGrid = (context, width, height, duration)->
    context.save()

    context.strokeStyle = '#bdc3c7'
    context.lineWidth = 1

    for i in [1..9]
      x = Math.floor (width  / 10) * i
      y = Math.floor (height / 10) * i

      context.beginPath()
      context.moveTo x, 0
      context.lineTo x, height
      context.stroke()

      context.beginPath()
      context.moveTo 0, y
      context.lineTo width, y
      context.stroke()

    context.restore()

  drawTime = (context, width, height, duration)->
    context.save()

    context.fillStyle = '#7f8c8d'
    context.font = "18px monospace";

    for i in [0..9]
      x = Math.floor (width / 10) * i
      t = (duration / 10) * i
      context.fillText t.toFixed(1), x + 3, height - 2

    context.restore()

  drawrange = (context, width, height, range)->
    context.save()

    context.fillStyle = '#7f8c8d'
    context.font = "18px monospace";

    for i in [1..9]
      y = height - (Math.floor (height / 10) * i)
      t = (range / 10) * i
      context.fillText t.toFixed(1), 3, y - 4

    context.restore()

  drawValues = (context, width, height, values, max)->
    context.save()

    dx  = width / values.length
    min = 0

    context.strokeStyle = '#e74c3c'
    context.lineWidth = 4

    context.beginPath()
    context.moveTo 0, calcY(values[0], height, min, max)
    for value, i in values
      x = dx * i
      y = calcY value, height, min, max
      context.lineTo x, y
    context.stroke()

    context.restore()

  getValues = (code, duration)->
    audioContext = new AudioContext()
    sampleRate = audioContext.sampleRate

    gain = audioContext.createGain()
    gain.connect audioContext.destination

    param = gain.gain
    eval code

    audioContext.$process duration

    length = Math.floor duration * sampleRate / CONTROL_SAMPLES
    values = new Float32Array(length)

    for i in [0...length] by 1
      values[i] = gain.gain.$valueAtTime i * (128 / sampleRate)

    values

  calcY = (value, height, min, max)->
    value = value / (max - min)
    height - height * value

  vue = new Vue
    el: '#app'
    data:
      width: 700
      height: 350
      duration: 1
      range: 1
      values: [ [] ]
    computed:
      durationVal:
        $get: ->
          [ 0.5, 1, 2, 3, 4, 5, 7.5, 10, 15, 20, 30 ][@duration]
      rangeVal:
        $get: ->
          [ 0.5, 1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 150000 ][@range]
    methods:
      update: ->
        code = editor.getValue()
        hash = '#' + window.encodeURIComponent code.trim()

        if window.location.hash isnt hash
          window.location.replace hash

        @values[0] = getValues code, 30
        @draw()

      draw: ->
        length = Math.floor @durationVal * SAMPLERATE / CONTROL_SAMPLES
        values = @values[0].subarray 0, length

        draw values, @durationVal, @rangeVal

      clear: ->
        editor.setValue ''

  editor = CodeMirror document.getElementById('editor'),
    mode: 'javascript', theme: 'monokai', workTime: 200, value: '''
    var t0 = 0;
    var t1 = 0.1;
    var t2 = 0.2;
    var t3 = 0.3;
    var t4 = 0.4;
    var t5 = 0.6;
    var t6 = 0.7;
    var t7 = 1.0;

    var curveLength = 44100;
    var curve = new Float32Array(curveLength);
    for (var i = 0; i < curveLength; ++i)
        curve[i] = Math.sin(Math.PI * i / curveLength);

    param.setValueAtTime(0.2, t0);
    param.setValueAtTime(0.3, t1);
    param.setValueAtTime(0.4, t2);
    param.linearRampToValueAtTime(1, t3);
    param.linearRampToValueAtTime(0.15, t4);
    param.exponentialRampToValueAtTime(0.75, t5);
    param.exponentialRampToValueAtTime(0.05, t6);
    param.setValueCurveAtTime(curve, t6, t7 - t6);
    '''

  if window.location.hash
    editor.setValue window.decodeURIComponent window.location.hash.substr(1)

  vue.update()
  prettyPrint()
