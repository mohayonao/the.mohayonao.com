$ ->
  'use strict'
  
  canvas = document.getElementById 'result'
  canvas.width  = 512
  canvas.height = 512
  context = canvas.getContext '2d'

  draw = (param)->
    if image.saved
      image.imageData.data.set image.saved
      data = image.imageData.data
      for i in [0...data.length] by 4
        gray = 0.114 * data[i] + 0.587 * data[i+1] + 0.299 * data[i+2]
        data[i+0] = data[i+0] * (1 - param) + gray * param
        data[i+1] = data[i+1] * (1 - param) + gray * param
        data[i+2] = data[i+2] * (1 - param) + gray * param
      context.putImageData image.imageData, 0, 0
  
  $('#param').on 'change', ->
    draw $(this).val() * 0.01
  
  image = document.getElementById('src')
  $(image).on 'load', ->
    context.drawImage @, 0, 0, @width, @height, 0, 0, canvas.width, canvas.height
    image.imageData = context.getImageData 0, 0, canvas.width, canvas.height
    image.saved = new Uint8ClampedArray(image.imageData.data)
    draw 1
