const fetch = require("./utils/fetch");
const assign = require("object-assign");
const parseJS = require("./parseJS");
const captureSignal = require("./captureSignal");
const drawSignal = require("./drawSignal");
const fetchFromPreset = require("./fetchFromPreset");
const fetchFromLocalStorage = require("./fetchFromLocalStorage");
const fetchFromGist = require("./fetchFromGist");
const localStorageUtils = require("./localStorageUtils");
const SAMPLERATE = 44100;
const PRESETS = [
  "web-audio-api-example6",
  "value-curve",
  "adsr-envelope",
];

module.exports = () => {
  function isPresetCode(url) {
    return PRESETS.indexOf(url) !== -1;
  }

  function isLocalStorageCode(url) {
    return /^localStorage:\d$/.test(url);
  }

  function isGistCode(url) {
    return /gist:[a-f0-9]+/.test(url);
  }

  function showMessage(text) {
    document.getElementById("message").style.color = "#000";
    document.getElementById("message").textContent = text;
  }

  function showErrorMessage(text) {
    document.getElementById("message").style.color = "#f00";
    document.getElementById("message").textContent = text;
  }

  function changeCode(code) {
    parseJS(code, (err, code) => {
      if (err) {
        return showErrorMessage("L:" + err.lineNumber + " " + err.description);
      }
      showMessage("");

      checkCode(code, updateViewer);
    });
  }

  function checkCode(code, callback) {
    let worker = new Worker("worker.js");

    worker.onmessage = (e) => {
      callback(e.data[0], assign({ code: code }, e.data[1]));
    };

    worker.postMessage(code);
  }

  function updateViewer(err, params) {
    if (err) {
      return showErrorMessage(err);
    }
    if (!isFinite(params.duration) || params.duration <= 0 || 10 <= params.duration) {
      return showErrorMessage("Invalid code: duration " + params.duration);
    }

    let length = Math.ceil(params.duration * SAMPLERATE);

    captureSignal(params.code, length, SAMPLERATE, (data) => {
      drawSignal(data, params.duration, params.minValue, params.maxValue);
      if (isLocalStorageCode(app.preset)) {
        localStorageUtils.setItem(app.preset, code);
      }
    });
  }

  let app = new global.Vue({
    el: "#app",
    data: {
      presets: PRESETS.map((value) => {
        return { name: value };
      }).concat([ 0, 1, 2 ].map((index) => {
        return { name: "localStorage:" + index };
      })),
      preset: PRESETS[0],
    },
    methods: {
      changePreset() {
        let promise = Promise.resolve("");

        if (isLocalStorageCode(this.preset)) {
          promise = fetchFromLocalStorage(this.preset);
        }
        if (isGistCode(this.preset)) {
          promise = fetchFromGist(this.preset.slice(5));
        }
        if (isPresetCode(this.preset)) {
          promise = fetchFromPreset(this.preset);
        }
        promise.then((code) => {
          editor.setValue(code);
        });
      }
    }
  });

  let editor = global.CodeMirror(document.getElementById("editor"), {
    mode: "javascript", theme: "monokai", workTime: 200, lineNumbers: true
  });

  editor.on("change", () => {
    changeCode(editor.getValue());
  });

  if (location.hash) {
    let hash = location.hash.slice(1);

    if (isPresetCode(hash)) {
      app.preset = hash;
    }
    if (isGistCode(hash)) {
      app.presets.push({ name: hash });
      app.preset = hash;
    }
  }

  app.changePreset();

  fetch("reference.txt").then((res) => {
    return res.text();
  }).then((code) => {
    document.getElementById("reference").textContent = code;
  });
};
