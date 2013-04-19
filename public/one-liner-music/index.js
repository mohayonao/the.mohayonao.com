(function() {
  $(function() {
    'use strict';
    var $func, BUFFER_MASK, BUFFER_SIZE, OneLinerProcessor, SAMPLERATE, commit, elem_map, history, init_history, processor, q;

    SAMPLERATE = 8000;
    BUFFER_SIZE = 1 << 16;
    BUFFER_MASK = BUFFER_SIZE - 1;
    MutekiTimer.use();
    processor = new (OneLinerProcessor = (function() {
      var onmessage;

      function OneLinerProcessor() {
        this.buffer = new Uint8Array(BUFFER_SIZE);
        this.rindex = this.windex = this.timerId = 0;
        this.acceptTimerId = 0;
      }

      onmessage = function(e) {
        var i, stream, _i, _ref, _results;

        if (e.data instanceof Array) {
          stream = e.data;
          _results = [];
          for (i = _i = 0, _ref = stream.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push(this.buffer[this.windex++ & BUFFER_MASK] = stream[i]);
          }
          return _results;
        } else {
          switch (e.data) {
            case 'ready':
              return this.ready();
            case 'error':
              return typeof this.onerror === "function" ? this.onerror() : void 0;
            case 'accept':
              this.accept = true;
              return typeof this.onaccept === "function" ? this.onaccept() : void 0;
          }
        }
      };

      OneLinerProcessor.prototype.play = function() {
        var _this = this;

        if (this.timerId !== 0) {
          clearInterval(this.timerId = 0);
        }
        return this.timerId = setInterval(function() {
          if (_this.windex - 4096 < _this.rindex) {
            return _this.worker.postMessage(0);
          }
        }, 100);
      };

      OneLinerProcessor.prototype.pause = function() {
        if (this.timerId !== 0) {
          clearInterval(this.timerId = 0);
        }
        return this.timerId = 0;
      };

      OneLinerProcessor.prototype.fetch = function() {
        return this.buffer[this.rindex++ & BUFFER_MASK];
      };

      OneLinerProcessor.prototype.next = function() {
        return this.buffer[this.rindex++ & BUFFER_MASK] / 256;
      };

      OneLinerProcessor.prototype.setFunction = function(func) {
        this.func = func;
        if (this.worker) {
          this.worker.terminate();
        }
        this.worker = new Worker('/one-liner-music/worker.js');
        return this.worker.onmessage = onmessage.bind(this);
      };

      OneLinerProcessor.prototype.ready = function() {
        var _this = this;

        this.accept = false;
        this.worker.postMessage(this.func);
        if (this.acceptTimerId) {
          clearTimeout(this.acceptTimerId);
        }
        return this.acceptTimerId = setTimeout(function() {
          if (!_this.accept) {
            return typeof _this.onerror === "function" ? _this.onerror() : void 0;
          }
        }, 500);
      };

      OneLinerProcessor.prototype.process = function(L, R) {
        var i, _i, _ref, _results;

        _results = [];
        for (i = _i = 0, _ref = L.length; _i < _ref; i = _i += 1) {
          _results.push(L[i] = R[i] = this.next());
        }
        return _results;
      };

      return OneLinerProcessor;

    })());
    pico.setup({
      samplerate: 8000
    });
    $('#play').on('click', function() {
      if (pico.isPlaying) {
        processor.pause();
        pico.pause();
        return $(this).css({
          color: 'black'
        });
      } else {
        processor.play();
        pico.play(processor);
        return $(this).css({
          color: 'red'
        });
      }
    });
    $func = $('#func');
    elem_map = {};
    init_history = ['(t>>4)&((t<<5)|(Math.sin(t)*3000))', 't<<(t&7)|(t*(t/500)*0.25)', '(t&(t>>10))*(t>>11)&(15<<(t>>16))|t*(t+12)>>(t>>14)&13', '(t<<1)/(~t&(1<<(t&15)))', '(t*5&t>>7)|(t*3&t>>10)', 't*((t>>12|t>>8)&63&t>>4)'];
    history = JSON.parse(localStorage.getItem('history')) || init_history;
    (function() {
      var h, list, _i, _len, _results;

      list = history.slice(0);
      list.reverse();
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        h = list[_i];
        elem_map[h] = $('<li>').text(h);
        _results.push($('#history').after(elem_map[h]));
      }
      return _results;
    })();
    commit = function() {
      var func;

      func = $func.css({
        color: 'black'
      }).val();
      return processor.setFunction(func);
    };
    $func.on('keyup', function(e) {
      if (e.keyCode === 13) {
        return commit();
      }
    });
    processor.onerror = function() {
      return $func.css({
        color: 'red'
      });
    };
    processor.onaccept = function() {
      var func, h, i, isExists, _i, _len;

      func = processor.func;
      isExists = false;
      for (i = _i = 0, _len = history.length; _i < _len; i = ++_i) {
        h = history[i];
        if (h === func) {
          isExists = true;
          history.splice(i, 1);
          break;
        }
      }
      if (!isExists) {
        elem_map[func] = $('<li>').text(func);
      } else {
        elem_map[func].remove();
      }
      $('#history').after(elem_map[func]);
      history.unshift(func);
      history = history.slice(0, 25);
      return localStorage.setItem('history', JSON.stringify(history));
    };
    $('#tweet').on('click', function() {
      var func, text, url;

      url = "http://" + location.host + "/one-liner-music/";
      text = "いい曲できた";
      func = encodeURIComponent(processor.func);
      return apps.tweet({
        text: text,
        url: "" + url + "?" + func + "&"
      });
    });
    if ((q = location.search.substr(1, location.search.length - 2))) {
      $func.val(decodeURIComponent(q));
    } else if (history[0]) {
      $func.val(history[0]);
    }
    commit();
    if (apps.isPhone) {
      return $('#history-container').hide();
    }
  });

}).call(this);
