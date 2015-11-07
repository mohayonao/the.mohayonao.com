const EventEmitter = require("events").EventEmitter;

module.exports = class ZanzoApplication extends EventEmitter {
  generate(buffer) {
    let worker = new Worker("worker.js");

    worker.onmessage = (e) => {
      if (typeof this[e.data.type] === "function") {
        this[e.data.type](...e.data.args);
      }
    };

    worker.postMessage(buffer, [ buffer ]);
  }

  init(numFrames, width, height) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    this.image = this.context.createImageData(this.width, this.height);

    this.emit("init", this.canvas);
  }

  progress(data) {
    this.image.data.set(data);
    this.context.putImageData(this.image, 0, 0);
  }

  finish() {
    let image = new Image();

    image.width  = this.width;
    image.height = this.height;

    image.src = this.canvas.toDataURL("image/png");

    this.emit("ended", image);
  }
}
