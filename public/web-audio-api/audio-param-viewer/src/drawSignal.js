const linlin = require("./utils/linlin");

const drawBackground = (canvas) => {
  let context = canvas.getContext("2d");

  context.fillStyle = "#ecf0f1";
  context.fillRect(0, 0, canvas.width, canvas.height);
};

const drawValues = (canvas, data, minValue, maxValue) => {
  let context = canvas.getContext("2d");

  context.beginPath();

  for (let i = 0; i < data.length; i++) {
    let x = linlin(i, 0, data.length, 0, canvas.width);
    let y = linlin(data[i], minValue, maxValue, canvas.height, 0);

    context.lineTo(x, y);
  }

  context.strokeStyle = "#e74c3c";
  context.lineWidth = 4;
  context.stroke();
}

const drawTimeGrid = (canvas, duration) => {
  let context = canvas.getContext("2d");
  let step = duration / 5;

  context.strokeStyle = "#bdc3c7";
  context.lineWidth = 1;
  context.fillStyle = "#7f8c8d";
  context.font = "18px monospace";

  for (let i = step; i < duration; i += step) {
    let x = Math.floor(linlin(i, 0, duration, 0, canvas.width)) + 0.5;

    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);

    context.stroke();

    context.fillText(i.toFixed(2) + "s", x + 3, canvas.height - 4);
  }
};

const drawRangeGrid = (canvas, minValue, maxValue) => {
  let context = canvas.getContext("2d");
  let _minValue = Math.floor(minValue);
  let _maxValue = Math.ceil(maxValue);
  let step = (_maxValue - _minValue) / 5;

  context.strokeStyle = "#bdc3c7";
  context.lineWidth = 1;
  context.fillStyle = "#7f8c8d";
  context.font = "18px monospace";

  for (let i = _minValue; i < _maxValue; i += step) {
    let y = Math.floor(linlin(i, minValue, maxValue, canvas.height, 0)) + 0.5;

    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);

    context.stroke();

    context.fillText(i.toFixed(1), 3, y - 4);
  }
};

module.exports = (data, duration, minValue, maxValue) => {
  let canvas = document.getElementById("canvas");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  drawBackground(canvas);
  drawTimeGrid(canvas, duration);
  drawRangeGrid(canvas, minValue, maxValue);
  drawValues(canvas, data, minValue, maxValue);
};
