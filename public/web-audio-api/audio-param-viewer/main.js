window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

window.fetch = window.fetch || function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url);

    xhr.onload = function() {
      resolve({
        text: function() {
          return xhr.response;
        },
        json: function() {
          return JSON.parse(xhr.response);
        },
      });
    };
    xhr.onerror = reject;
    xhr.send();
  });
};

window.addEventListener("DOMContentLoaded", function() {
  "use strict";

  var SAMPLERATE = 44100;
  var PRESETS = [
    "web-audio-api-example6",
    "value-curve",
    "adsr-envelope",
  ];

  function fetchText(url) {
    return fetch(url).then(function(res) { return res.text(); });
  }

  function isPresetCode(url) {
    return PRESETS.indexOf(url) !== -1;
  }

  function isLocalStorageCode(url) {
    return /^localStorage:\d$/.test(url);
  }

  function isGistCode(url) {
    return /gist:[a-f0-9]+/.test(url);
  }

  function fetchFromLocalStorage(url) {
    var key = "/web-audio-api/audio-param-viewer/" + url;
    var code = localStorage.getItem(key) || "";

    return Promise.resolve(code);
  }

  function storeToLocalStorage(url, code) {
    var key = "/web-audio-api/audio-param-viewer/" + url;

    localStorage.setItem(key, code);
  }

  function fetchFromGist(gistId, callback) {
    var url = "https://api.github.com/gists/" + gistId;

    return fetch(url).then(function(res) {
      return res.json();
    }).then(function(data) {
      var files = [];

      Object.keys(data.files).forEach(function(key) {
        files.push(data.files[key]);
      })

      files = files.filter(function(items) {
        return items.language === "JavaScript";
      }).map(function(items) {
        return items.content;
      });

      return files[0] || "";
    });
  }

  function linlin(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
  }

  function parseJSCode(code, callback) {
    try {
      esprima.parse(code);
      callback(null, code);
    } catch (e) {
      callback(e, "");
    }
  }

  function showMessage(text) {
    document.getElementById("message").style.color = "#000";
    document.getElementById("message").textContent = text;
  }

  function showErrorMessage(text) {
    document.getElementById("message").style.color = "#f00";
    document.getElementById("message").textContent = text;
  }

  function capture(code, length, sampleRate, callback) {
    var audioContext = new OfflineAudioContext(1, length, sampleRate);
    var buffer = audioContext.createBuffer(1, 4, sampleRate);
    var bufSrc = audioContext.createBufferSource();
    var gain = audioContext.createGain();

    buffer.getChannelData(0).set(new Float32Array([ 1, 1, 1, 1 ]));
    bufSrc.buffer = buffer;
    bufSrc.loop = true;
    bufSrc.start(0);
    bufSrc.connect(gain);

    gain.connect(audioContext.destination);

    window.param = gain.gain;
    try {
      eval.call(null, code);
    } catch (e) {
      return showErrorMessage(e.toString());
    } finally {
      delete window.param;
    }

    audioContext.oncomplete = function(e) {
      callback(e.renderedBuffer.getChannelData(0));
    };
    audioContext.startRendering();
  }

  function draw(data, duration, minValue, maxValue) {
    var canvas = document.getElementById("canvas");

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    drawBackground(canvas);
    drawTimeGrid(canvas, duration);
    drawRangeGrid(canvas, minValue, maxValue);
    drawValues(canvas, data, minValue, maxValue);
  }

  function drawBackground(canvas) {
    var context = canvas.getContext("2d");

    context.fillStyle = "#ecf0f1";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawValues(canvas, data, minValue, maxValue) {
    var context = canvas.getContext("2d");

    context.beginPath();

    for (var i = 0; i < data.length; i++) {
      var x = linlin(i, 0, data.length, 0, canvas.width);
      var y = linlin(data[i], minValue, maxValue, canvas.height, 0);

      context.lineTo(x, y);
    }

    context.strokeStyle = "#e74c3c";
    context.lineWidth = 4;
    context.stroke();
  }

  function drawTimeGrid(canvas, duration) {
    var context = canvas.getContext("2d");
    var step = duration / 5;

    context.strokeStyle = "#bdc3c7";
    context.lineWidth = 1;
    context.fillStyle = "#7f8c8d";
    context.font = "18px monospace";

    for (var i = step; i < duration; i += step) {
      var x = Math.floor(linlin(i, 0, duration, 0, canvas.width)) + 0.5;

      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);

      context.stroke();

      context.fillText(i.toFixed(2) + "s", x + 3, canvas.height - 4);
    }
  }

  function drawRangeGrid(canvas, minValue, maxValue) {
    var context = canvas.getContext("2d");
    var _minValue = Math.floor(minValue);
    var _maxValue = Math.ceil(maxValue);
    var step = (_maxValue - _minValue) / 5;

    context.strokeStyle = "#bdc3c7";
    context.lineWidth = 1;
    context.fillStyle = "#7f8c8d";
    context.font = "18px monospace";

    for (var i = _minValue; i < _maxValue; i += step) {
      var y = Math.floor(linlin(i, minValue, maxValue, canvas.height, 0)) + 0.5;

      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);

      context.stroke();

      context.fillText(i.toFixed(1), 3, y - 4);
    }
  }

  var app = new Vue({
    el: "#app",
    data: {
      presets: PRESETS.map(function(value) {
        return { name: value };
      }).concat([ 0, 1, 2 ].map(function(index) {
        return { name: "localStorage:" + index };
      })),
      preset: PRESETS[0],
    },
    methods: {
      changePreset: function() {
        if (isLocalStorageCode(this.preset)) {
          fetchFromLocalStorage(this.preset).then(function(code) {
            editor.setValue(code);
          });
        } else if (isGistCode(this.preset)) {
          fetchFromGist(this.preset.slice(5)).then(function(code) {
            editor.setValue(code);
          });
        } else if (isPresetCode(this.preset)) {
          fetchText("./presets/" + this.preset + ".js").then(function(code) {
            editor.setValue(code);
          });
        }
      }
    }
  });

  var editor = CodeMirror(document.getElementById("editor"), {
    mode: "javascript", theme: "monokai", workTime: 200, lineNumbers: true
  });

  editor.on("change", function() {
    parseJSCode(editor.getValue(), function(err, code) {
      var worker = null;

      if (err) {
        return showErrorMessage("L:" + err.lineNumber + " " + err.description);
      }

      showMessage("");

      worker = new Worker("worker.js");

      worker.postMessage(code);

      worker.onmessage = function(e) {
        var err = e.data[0];
        var params = e.data[1];

        if (err) {
          return showErrorMessage(err);
        }

        if (!isFinite(params.duration) || params.duration <= 0 || 10 <= params.duration) {
          return showErrorMessage("Invalid code: duration " + params.duration);
        }

        var length = Math.ceil(params.duration * SAMPLERATE);

        capture(code, length, SAMPLERATE, function(data) {
          draw(data, params.duration, params.minValue, params.maxValue);
          if (isLocalStorageCode(app.preset)) {
            storeToLocalStorage(app.preset, code);
          }
        });
      };
    });
  });

  if (location.hash) {
    var hash = location.hash.slice(1);

    if (isPresetCode(hash)) {
      app.preset = hash;
    }
    if (isGistCode(hash)) {
      app.presets.push({ name: hash });
      app.preset = hash;
    }
  }

  app.changePreset();

  fetchText("reference.txt").then(function(code) {
    document.getElementById("reference").textContent = code;
  });
});
