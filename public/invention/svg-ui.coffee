$ ->
  'use strict'

  svg = (tag, attrs)->
    elem = document.createElementNS 'http://www.w3.org/2000/svg', tag
    if attrs then svg.attrs elem, attrs
    elem
  svg.attrs = (elem, attrs)->
    Object.keys(attrs).forEach (key)->
      elem.setAttribute key, attrs[key]
    elem

  $('ul.svg-radio').each (i, ul)->
    list = []
    $('li', $(ul)).each (i, li)->
      $li = $(li)
      list.push [$li.attr('value'), $li.attr('checked'), $li.text()]
    container = svg 'svg', 
      height: list.length * 40 - 30
      id: $(ul).attr 'id'
    checkedId = 0
    list.forEach (li, i)->
      g = svg 'g'
      cy = i * 30 + 10
      input = svg 'circle',
        cx: 20, cy: cy, r: 8
        'stroke-width': 2
        'stroke': '#34495E'
        'fill'  : 'white'
        'cursor': 'pointer'
      text = svg 'text',
        x: 35, y: cy+6
        'font-size': '18px'
        'fill'  : '#34495E'
        'cursor': 'default'
      g.onclick = ->
        svg.attrs check, cy: cy
        svg.attrs container, value: li[0]
      text.appendChild document.createTextNode li[2]
      g.appendChild input
      g.appendChild text
      container.appendChild g
      if li[1] then checkedId = i
    check = svg 'circle',
      cx: 20
      cy: checkedId * 30 + 10
      r: 4
      'fill': '#34495E'
      'pointer-events': 'none'
    svg.attrs container, value: list[checkedId][0]
    container.appendChild check
    $(ul).replaceWith container
