(function() {
  $(function() {
    'use strict';
    var svg;

    svg = function(tag, attrs) {
      var elem;

      elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (attrs) {
        svg.attrs(elem, attrs);
      }
      return elem;
    };
    svg.attrs = function(elem, attrs) {
      Object.keys(attrs).forEach(function(key) {
        return elem.setAttribute(key, attrs[key]);
      });
      return elem;
    };
    return $('ul.svg-radio').each(function(i, ul) {
      var check, checkedId, container, list;

      list = [];
      $('li', $(ul)).each(function(i, li) {
        var $li;

        $li = $(li);
        return list.push([$li.attr('value'), $li.attr('checked'), $li.text()]);
      });
      container = svg('svg', {
        height: list.length * 40 - 30,
        id: $(ul).attr('id')
      });
      checkedId = 0;
      list.forEach(function(li, i) {
        var cy, g, input, text;

        g = svg('g');
        cy = i * 30 + 10;
        input = svg('circle', {
          cx: 20,
          cy: cy,
          r: 8,
          'stroke-width': 2,
          'stroke': '#34495E',
          'fill': 'white',
          'cursor': 'pointer'
        });
        text = svg('text', {
          x: 35,
          y: cy + 6,
          'font-size': '18px',
          'fill': '#34495E',
          'cursor': 'default'
        });
        g.onclick = function() {
          svg.attrs(check, {
            cy: cy
          });
          return svg.attrs(container, {
            value: li[0]
          });
        };
        text.appendChild(document.createTextNode(li[2]));
        g.appendChild(input);
        g.appendChild(text);
        container.appendChild(g);
        if (li[1]) {
          return checkedId = i;
        }
      });
      check = svg('circle', {
        cx: 20,
        cy: checkedId * 30 + 10,
        r: 4,
        'fill': '#34495E',
        'pointer-events': 'none'
      });
      svg.attrs(container, {
        value: list[checkedId][0]
      });
      container.appendChild(check);
      return $(ul).replaceWith(container);
    });
  });

}).call(this);
