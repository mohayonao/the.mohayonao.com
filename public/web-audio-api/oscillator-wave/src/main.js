const graphSpecs = require("./graphSpecs");
const captureSignal = require("./captureSignal");
const drwaSignal = require("./drawSignal");

module.exports = () => {
  graphSpecs.forEach((spec) => {
    let type = spec.type;
    let frequency = spec.frequency;
    let canvas = document.createElement("canvas");

    canvas.width = 240;
    canvas.height = 120;

    captureSignal(type, frequency, 44100, (buffer) => {
      let caption = `type= ${type}; freq= ${frequency}Hz`;

      drwaSignal(canvas, buffer, caption);
    });

    document.getElementById("app").appendChild(canvas);
  });
};
