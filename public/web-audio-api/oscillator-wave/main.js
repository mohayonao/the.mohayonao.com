window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

window.addEventListener("DOMContentLoaded", function() {
  "use strict";

  var audioContext = new AudioContext();
  var sampleRate = audioContext.sampleRate;
  var specs = [
    { type: "sine"    , frequency: 1 },
    { type: "square"  , frequency: 1 },
    { type: "sawtooth", frequency: 1 },
    { type: "triangle", frequency: 1 },
    { type: "sine"    , frequency: sampleRate / 10000 },
    { type: "square"  , frequency: sampleRate / 10000 },
    { type: "sawtooth", frequency: sampleRate / 10000 },
    { type: "triangle", frequency: sampleRate / 10000 },
    { type: "sine"    , frequency: sampleRate / 100 },
    { type: "square"  , frequency: sampleRate / 100 },
    { type: "sawtooth", frequency: sampleRate / 100 },
    { type: "triangle", frequency: sampleRate / 100 },
    { type: "sine"    , frequency: sampleRate / 50 },
    { type: "square"  , frequency: sampleRate / 50 },
    { type: "sawtooth", frequency: sampleRate / 50 },
    { type: "triangle", frequency: sampleRate / 50 },
  ];

  function capture(type, frequency, callback) {
    var length = Math.ceil(sampleRate / frequency);
    var audioContext = new OfflineAudioContext(1, length, sampleRate);
    var oscillator = audioContext.createOscillator();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.start(0);
    oscillator.stop(length * sampleRate);
    oscillator.connect(audioContext.destination);

    audioContext.oncomplete = function(e) {
      callback(e.renderedBuffer.getChannelData(0));
    };
    audioContext.startRendering();
  }

  function draw(canvas, data, caption) {
    var context = canvas.getContext("2d");
    var textWidth = context.measureText(caption).width;

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#0c0";
    context.beginPath();

    for (var i = 0; i < data.length; i++) {
      var x = Math.round((i / (data.length - 1)) * canvas.width);
      var y = canvas.height * 0.5 - data[i] * canvas.height * 0.5;

      context.lineTo(x, y);
    }

    context.stroke();

    context.fillStyle = "#0f0";
    context.fillText(caption, canvas.width - textWidth - 4, 12);
  }

  specs.forEach(function(items) {
    var type = items.type;
    var frequency = items.frequency;
    var canvas = document.createElement("canvas");

    canvas.width = 240;
    canvas.height = 120;

    capture(type, frequency, function(buffer) {
      var caption = "type= " + type + "; freq= " + frequency + "Hz";

      draw(canvas, buffer, caption);
    });

    document.getElementById("app").appendChild(canvas);
  });
});
