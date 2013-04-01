(function() {
  'use strict';
  var CHORDS, drawChordForm, drawCoda, drawMap, drawParen, drawRepeat, drawRepeatLine, drawRepeatNum, drawRepeatStr, drawSegno, drawStroke, getForm, getImageData, getImageSrc, parse, prevForm, re;

  CHORDS = {
    'C': '3000',
    'Cm': '3330',
    'C7': '1000',
    'CM7': '2000',
    'Cm7': '3333',
    'Cdim': '3232',
    'Cm7(b5)': '3233',
    'Caug': '3001',
    'Csus4': '3355',
    'C6': '0000',
    'C7(9)': '1020',
    'CM7(9)': '2020',
    'CmM7': '3334',
    'Cadd9': '3020',
    'C#': '4111',
    'C#m': '4441',
    'C#7': '2111',
    'C#M7': '3111',
    'C#m7': '2011',
    'C#dim': '1010',
    'C#m7(b5)': '3233',
    'C#aug': '0112',
    'C#sus4': '2211',
    'C#6': '1111',
    'C#7(9)': '2131',
    'C#M7(9)': '3131',
    'C#mM7': '3011',
    'C#add9': '4131',
    'Db': '4111',
    'Dbm': '4441',
    'Db7': '2111',
    'DbM7': '3111',
    'Dbm7': '2011',
    'Dbdim': '1010',
    'Dbm7(b5)': '3233',
    'Dbaug': '0112',
    'Dbsus4': '2211',
    'Db6': '1111',
    'Db7(9)': '2131',
    'DbM7(9)': '3131',
    'DbmM7': '3011',
    'Dbadd9': '4131',
    'D': '0222',
    'Dm': '0122',
    'D7': '3222',
    'DM7': '4222',
    'Dm7': '3122',
    'Ddim': '2121',
    'Dm7(b5)': '3121',
    'Daug': '1223',
    'Dsus4': '0322',
    'D6': '2222',
    'D7(9)': '3242',
    'DM7(9)': '4242',
    'DmM7': '4122',
    'Dadd9': '5242',
    'D#': '1330',
    'D#m': '1233',
    'D#7': '4333',
    'D#M7': '5333',
    'D#m7': '4233',
    'D#dim': '3232',
    'D#m7(b5)': '4232',
    'D#aug': '2330',
    'D#sus4': '1433',
    'D#6': '4444',
    'D#7(9)': '1110',
    'D#M7(9)': '1120',
    'D#mM7': '5233',
    'D#add9': '1130',
    'Eb': '1330',
    'Ebm': '1233',
    'Eb7': '4333',
    'EbM7': '5333',
    'Ebm7': '4233',
    'Ebdim': '3232',
    'Ebm7(b5)': '4232',
    'Ebaug': '2330',
    'Ebsus4': '1433',
    'Eb6': '4444',
    'Eb7(9)': '1110',
    'EbM7(9)': '1120',
    'EbmM7': '5233',
    'Ebadd9': '1130',
    'E': '2444',
    'Em': '2344',
    'E7': '2021',
    'EM7': '2031',
    'Em7': '2020',
    'Edim': '1010',
    'Em7(b5)': '4232',
    'Eaug': '3001',
    'Esus4': '2544',
    'E6': '2011',
    'E7(9)': '2221',
    'EM7(9)': '2231',
    'EmM7': '2030',
    'Eadd9': '2241',
    'F': '0102',
    'Fm': '3101',
    'F7': '3132',
    'FM7': '0055',
    'Fm7': '3131',
    'Fdim': '2121',
    'Fm7(b5)': '2131',
    'Faug': '0112',
    'Fsus4': '1103',
    'F6': '3122',
    'F7(9)': '3332',
    'FM7(9)': '0000',
    'FmM7': '3141',
    'Fadd9': '0100',
    'F#': '1213',
    'F#m': '0212',
    'F#7': '4243',
    'F#M7': '4253',
    'F#m7': '4242',
    'F#dim': '3232',
    'F#m7(b5)': '3242',
    'F#aug': '1223',
    'F#sus4': '4244',
    'F#6': '4233',
    'F#7(9)': '4443',
    'F#M7(9)': '1111',
    'F#mM7': '4252',
    'F#add9': '1211',
    'Gb': '1213',
    'Gbm': '0212',
    'Gb7': '4243',
    'GbM7': '4253',
    'Gbm7': '4242',
    'Gbdim': '3232',
    'Gbm7(b5)': '3242',
    'Gbaug': '1223',
    'Gbsus4': '4244',
    'Gb6': '4233',
    'Gb7(9)': '4443',
    'GbM7(9)': '1111',
    'GbmM7': '4252',
    'Gbadd9': '1211',
    'G': '2320',
    'Gm': '1320',
    'G7': '2120',
    'GM7': '2220',
    'Gm7': '1120',
    'Gdim': '1010',
    'Gm7(b5)': '1110',
    'Gaug': '2330',
    'Gsus4': '3320',
    'G6': '2020',
    'G7(9)': '2122',
    'GM7(9)': '2222',
    'GmM7': '5363',
    'Gadd9': '2322',
    'G#': '3435',
    'G#m': '2431',
    'G#7': '3231',
    'G#M7': '3331',
    'G#m7': '2231',
    'G#dim': '2121',
    'G#m7(b5)': '2221',
    'G#aug': '3001',
    'G#sus4': '4431',
    'G#6': '3131',
    'G#7(9)': '3233',
    'G#M7(9)': '3333',
    'G#mM7': '6474',
    'G#add9': '3433',
    'Ab': '3435',
    'Abm': '2431',
    'Ab7': '3231',
    'AbM7': '3331',
    'Abm7': '2231',
    'Abdim': '2121',
    'Abm7(b5)': '2221',
    'Abaug': '3001',
    'Absus4': '4431',
    'Ab6': '3131',
    'Ab7(9)': '3233',
    'AbM7(9)': '3333',
    'AbmM7': '6474',
    'Abadd9': '3433',
    'A': '0012',
    'Am': '0002',
    'A7': '0010',
    'AM7': '0011',
    'Am7': '0000',
    'Adim': '3232',
    'Am7(b5)': '3332',
    'Aaug': '0112',
    'Asus4': '0022',
    'A6': '04242',
    'A7(9)': '2312',
    'AM7(9)': '2412',
    'AmM7': '0001',
    'Aadd9': '2012',
    'A#': '1123',
    'A#m': '1113',
    'A#7': '1121',
    'A#M7': '0123',
    'A#m7': '1111',
    'A#dim': '1010',
    'A#m7(b5)': '1011',
    'A#aug': '1223',
    'A#sus4': '1133',
    'A#6': '1120',
    'A#7(9)': '3423',
    'A#M7(9)': '5555',
    'A#mM7': '1112',
    'A#add9': '3123',
    'Bb': '1123',
    'Bbm': '1113',
    'Bb7': '1121',
    'BbM7': '0123',
    'Bbm7': '1111',
    'Bbdim': '1010',
    'Bbm7(b5)': '1011',
    'Bbaug': '1223',
    'Bbsus4': '1133',
    'Bb6': '1120',
    'Bb7(9)': '3423',
    'BbM7(9)': '5555',
    'BbmM7': '1112',
    'Bbadd9': '3123',
    'B': '2234',
    'Bm': '2224',
    'B7': '2232',
    'BM7': '1234',
    'Bm7': '2222',
    'Bdim': '2121',
    'Bm7(b5)': '2122',
    'Baug': '2334',
    'Bsus4': '2244',
    'B6': '2231',
    'B7(9)': '4232',
    'BM7(9)': '4133',
    'BmM7': '2223',
    'Badd9': '4234'
  };

  drawChordForm = function(ctx, form) {
    var flet_height, flet_num, flet_width, h, i, max_flet, paddingTop, w, x, y, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2, _results;

    paddingTop = 16;
    _ref = [5, 12, 8], flet_num = _ref[0], flet_width = _ref[1], flet_height = _ref[2];
    max_flet = 0;
    _ref1 = form.form;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      x = _ref1[_i];
      if (x > max_flet) {
        max_flet = +x;
      }
    }
    max_flet -= 4;
    if (max_flet < 0) {
      max_flet = 0;
    }
    ctx.fillText(form.name, form.x, form.y + 10);
    for (i = _j = 0; 0 <= flet_num ? _j <= flet_num : _j >= flet_num; i = 0 <= flet_num ? ++_j : --_j) {
      if (max_flet !== 0 && i === 0) {
        continue;
      }
      x = i === 0 ? 0 : 2 + (i - 1) * flet_width;
      x = form.x + x;
      y = form.y + paddingTop;
      h = flet_height * 3;
      ctx.fillRect(x, y, 1, h);
      if (max_flet !== 0 && i !== flet_num) {
        ctx.fillText(i + max_flet, x, y + 37);
      }
    }
    for (i = _k = 0; _k <= 3; i = ++_k) {
      x = form.x;
      w = flet_width * flet_num - (flet_width >> 1);
      y = form.y + (i * flet_height) + paddingTop;
      ctx.fillRect(x, y, w, 1);
    }
    _ref2 = form.form;
    _results = [];
    for (i = _l = 0, _len1 = _ref2.length; _l < _len1; i = ++_l) {
      x = _ref2[i];
      if (x === '0') {
        continue;
      }
      x = form.x + 3 + flet_width * (x - 1 - max_flet) + 4;
      y = form.y + i * flet_height + paddingTop;
      _results.push(ctx.fillRect(x - 1, y - 2, 5, 5));
    }
    return _results;
  };

  drawRepeat = function(ctx, form) {
    var p, x, y, _ref;

    _ref = [form.x, form.y], x = _ref[0], y = _ref[1];
    p = form.name === '|:' ? [0, 3, 6, 6] : [7, 5, 0, 0];
    ctx.fillRect(x + p[0], y + 4, 2, 38);
    ctx.fillRect(x + p[1], y + 4, 1, 38);
    ctx.fillRect(x + p[2], y + 4 + 11, 3, 3);
    return ctx.fillRect(x + p[3], y + 4 + 23, 3, 3);
  };

  drawRepeatLine = function(ctx, form) {
    ctx.fillRect(form.x, form.y + 7, 1, 34);
    return ctx.fillRect(form.x, form.y + 7, 6, 1);
  };

  drawRepeatNum = function(ctx, form) {
    return ctx.fillText(form.name, form.x, form.y + 10);
  };

  drawParen = function(ctx, form) {
    var p, x, y, _i, _len, _ref, _ref1, _results, _x, _y;

    _ref = [form.x, form.y + 1.5], x = _ref[0], y = _ref[1];
    p = form.name === '(' ? [[4, 2], [3, 4], [2, 6], [1, 18], [2, 6], [3, 4], [4, 2]] : [[1, 2], [2, 4], [3, 6], [4, 18], [3, 6], [2, 4], [1, 2]];
    _results = [];
    for (_i = 0, _len = p.length; _i < _len; _i++) {
      _ref1 = p[_i], _x = _ref1[0], _y = _ref1[1];
      ctx.fillRect(x + _x, y, 1, _y);
      _results.push(y += _y);
    }
    return _results;
  };

  drawStroke = function(ctx, form) {
    var x, y, _, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _results, _x, _y;

    if (!form.stroke) {
      return;
    }
    _ref = [form.x, form.y], x = _ref[0], y = _ref[1];
    _ref1 = form.stroke.toLowerCase();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      _ = _ref1[_i];
      switch (_) {
        case "p":
        case "d":
          ctx.fillRect(x, y, 4, 1);
          ctx.fillRect(x, y, 1, 6);
          ctx.fillRect(x + 4, y, 1, 6);
          break;
        case "u":
          _ref2 = [[0, 0], [1, 2], [2, 4], [3, 2], [4, 0]];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            _ref3 = _ref2[_j], _x = _ref3[0], _y = _ref3[1];
            ctx.fillRect(x + _x, y + _y, 1, 2);
          }
          break;
        case "x":
          _ref4 = [[0, 1], [0, 5], [1, 2], [1, 4], [2, 3]];
          for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
            _ref5 = _ref4[_k], _x = _ref5[0], _y = _ref5[1];
            ctx.fillRect(x + _x, y + _y, 1, 1);
            ctx.fillRect(x + 4 - _x, y + _y, 1, 1);
          }
          break;
        case '_':
          x += 8;
      }
      if (_ !== ',') {
        _results.push(x += 8);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  drawSegno = function(ctx, form) {
    var x, y, _ref;

    _ref = [form.x, form.y], x = _ref[0], y = _ref[1];
    ctx.fillRect(x + 1, y, 3, 1);
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + 2, y + 2, 1, 2);
    ctx.fillRect(x + 3, y + 4, 1, 1);
    ctx.fillRect(x + 1, y + 5, 3, 1);
    ctx.fillRect(x, y + 3, 1, 1);
    return ctx.fillRect(x + 4, y + 2, 1, 1);
  };

  drawCoda = function(ctx, form) {
    var x, y, _ref;

    _ref = [form.x, form.y], x = _ref[0], y = _ref[1];
    ctx.fillRect(x, y + 1, 1, 3);
    ctx.fillRect(x + 1, y, 3, 1);
    ctx.fillRect(x + 1, y + 4, 3, 1);
    ctx.fillRect(x + 4, y + 1, 1, 3);
    ctx.fillRect(x + 2, y - 1, 1, 7);
    return ctx.fillRect(x - 1, y + 2, 7, 1);
  };

  drawRepeatStr = function(ctx, form) {
    var name;

    name = (function() {
      switch (form.name) {
        case '^':
          return "Fin";
        case '<':
          if (form.hasSegno) {
            return "D.S.";
          } else {
            return "D.C.";
          }
      }
    })();
    return ctx.fillText(name, form.x - 4, form.y + 52);
  };

  drawMap = {
    '#': {
      width: 64,
      func: drawChordForm
    },
    '_': {
      width: 16
    },
    '=': {
      width: 64
    },
    '|:': {
      width: 16,
      func: drawRepeat
    },
    ':|': {
      width: 16,
      func: drawRepeat
    },
    '-': {
      width: 10,
      func: drawRepeatLine
    },
    '1': {
      width: 6,
      func: drawRepeatNum
    },
    '2': {
      width: 6,
      func: drawRepeatNum
    },
    '3': {
      width: 6,
      func: drawRepeatNum
    },
    '4': {
      width: 6,
      func: drawRepeatNum
    },
    '(': {
      width: 16,
      func: drawParen
    },
    ')': {
      width: 16,
      func: drawParen
    },
    "!": {
      width: 0,
      func: drawStroke
    },
    "$": {
      width: 0,
      func: drawSegno
    },
    "*": {
      width: 0,
      func: drawCoda
    },
    "<": {
      width: 16,
      func: drawRepeatStr
    },
    "^": {
      width: 16,
      func: drawRepeatStr
    },
    ';': {
      width: -1
    }
  };

  prevForm = null;

  getForm = function(name) {
    var form, i, m;

    if (name.charAt(0) === "!") {
      m = /^(\d+)?(:3)?([-PpDdUuXx,_]+)?/.exec(name.substr(1));
      return {
        type: "!",
        bpm: m[1],
        shuffle: !!m[2],
        stroke: m[3]
      };
    }
    form = CHORDS[name];
    if (form !== void 0) {
      return prevForm = {
        type: '#',
        name: name,
        form: form
      };
    }
    i = name.indexOf('@');
    if (i !== -1) {
      form = name.substr(i + 1);
      name = name.substr(0, i);
      return prevForm = {
        type: '#',
        name: name,
        form: form
      };
    }
    if (name === '=') {
      return {
        type: '=',
        name: prevForm.name,
        form: prevForm.form
      };
    } else {
      return {
        type: name,
        name: name
      };
    }
  };

  re = /(?:!\d*(?::3)?[-PpDdUuXx,_]*)|(?:[CDEFGAB][\#b]?(?:m7\(b5\)|M7\(9\)|7\(9\)|sus4|add9|aug|dim|mM7|m7|M7|m|7|6)?(?:@[0-5]{4})?)|\|:|:\||[-=_()1-4;$<^*]/g;

  parse = function(src) {
    var m, _results;

    _results = [];
    while (true) {
      m = re.exec(src);
      if (m === null) {
        break;
      }
      _results.push(getForm(m[0]));
    }
    return _results;
  };

  getImageData = function(src, opts) {
    var canvas, ctx, h, hasSegno, list, m, strokeOnly, w, x, y, _, _i, _len, _ref;

    _ref = [8, 8, 8, 8], x = _ref[0], y = _ref[1], w = _ref[2], h = _ref[3];
    hasSegno = false;
    strokeOnly = false;
    list = (function() {
      var _i, _len, _ref1, _ref2, _ref3, _results;

      _ref1 = parse(src);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _ = _ref1[_i];
        m = drawMap[_.type];
        if (m.width === -1) {
          _ref2 = strokeOnly ? [8, y + 12] : [8, y + 64], x = _ref2[0], y = _ref2[1];
          strokeOnly = false;
        }
        if (strokeOnly) {
          if (_.type !== "!") {
            strokeOnly = false;
          }
        } else if (_.type === "!") {
          strokeOnly = true;
        }
        _ref3 = [x, y, m.func], _.x = _ref3[0], _.y = _ref3[1], _.func = _ref3[2];
        if (m.width === 0) {
          _.y -= 6;
        }
        switch (_.type) {
          case "$":
            hasSegno = true;
            break;
          case "<":
            _.hasSegno = hasSegno;
        }
        x += m.width;
        if (w < x) {
          w = x;
        }
        if (h < y) {
          h = y;
        }
        _results.push(_);
      }
      return _results;
    })();
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h + 64;
    ctx = canvas.getContext('2d');
    if (opts != null ? opts.background : void 0) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, w, h + 64);
    }
    ctx.strokeStyle = (opts != null ? opts.color : void 0) || '#000';
    ctx.fillStyle = (opts != null ? opts.color : void 0) || '#000';
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      _ = list[_i];
      if (_.func) {
        _.func(ctx, _);
      }
    }
    return ctx.getImageData(0, 0, w, h + 64);
  };

  getImageSrc = function(src, opts) {
    var canvas, imgData;

    if (typeof src === 'string') {
      src = getImageData(src, opts);
    }
    if (src instanceof ImageData) {
      imgData = src;
    } else {
      return '';
    }
    canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    canvas.getContext('2d').putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  window.lelenofu = {
    parse: parse,
    getImageData: getImageData,
    getImageSrc: getImageSrc
  };

}).call(this);
