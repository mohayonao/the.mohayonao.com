(function(global) {
  "use stirct";

  var CANVAS_WIDTH  = 728;
  var CANVAS_HEIGHT = 182;
  var CANVAS_BG = "#34495e";

  function CiseauxPlayer(audioContext, canvas) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    var comp = audioContext.createDynamicsCompressor();
    comp.connect(audioContext.destination);
    comp.threshold.value = -18;
    comp.knee.value = 8;

    this.audioContext = audioContext;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.isPlaying = false;
    this.bufSrc = null;
    this.destination = comp;

    this._chored = false;
  }

  CiseauxPlayer.prototype.chore = function() {
    if (!this._chored) {
      bufSrc = this.audioContext.createBufferSource();
      bufSrc.start(this.audioContext.currentTime);
      bufSrc.connect(this.audioContext.destination);
      bufSrc.stop(this.audioContext.currentTime);
      bufSrc.disconnect();
      this._chored = true;
    }
    return this;
  };

  CiseauxPlayer.prototype.exec = function(src) {
    if (this.isPlaying) {
      this.stop();
    }

    window.tape = null;

    try {
      eval.call(null, src);
    } catch (e) {
      console.error(e);
    }

    if (window.tape instanceof Ciseaux.Tape) {
      window.tape.render(this.audioContext, 2).then(function(audioBuffer) {
        this.play(audioBuffer);
      }.bind(this));
      this.isPlaying = true;
    }

    window.tape = null;

    return this;
  };

  CiseauxPlayer.prototype.stop = function() {
    if (this.isPlaying && this.bufSrc) {
      this.bufSrc.stop(this.audioContext.currentTime);
      this.bufSrc.disconnect();
      this.bufSrc = null;
    }
    this.isPlaying = false;

    return this;
  };

  CiseauxPlayer.prototype.play = function(audioBuffer) {
    this.bufSrc = this.audioContext.createBufferSource();
    this.bufSrc.buffer = audioBuffer;
    this.bufSrc.connect(this.destination);
    this.bufSrc.onended = function() {
      this.stop();
    }.bind(this);
    this.duration = audioBuffer.duration;

    requestAnimationFrame(function(t) {
      var step = Math.floor(audioBuffer.length / CANVAS_WIDTH * 0.025) || 1;
      var dx = CANVAS_WIDTH / audioBuffer.length;

      this.prevx = -1;
      this.startTime = t;

      this.context.save();
      this.context.fillStyle = "#272822";
      this.context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.context.strokeStyle = "#ecf0f1";
      this.context.lineWidth = 0.5;

      for (var ch = 0; ch < 2; ch++) {
        var samples = audioBuffer.getChannelData(ch);
        var yOffset = CANVAS_HEIGHT * 0.5 * ch;

        this.context.beginPath();
        for (var i = 0, imax = samples.length; i < imax; i += step) {
          var x = Math.floor(i * dx);
          var y = Math.floor(CANVAS_HEIGHT * (1 - samples[i]) * 0.25 + yOffset);
          this.context.lineTo(x, y);
        }
        this.context.stroke();
      }
      this.context.restore();

      this.bufSrc.start(this.audioContext.currentTime);

      requestAnimationFrame(function(t) {
        this.animation(t);
      }.bind(this));
    }.bind(this));

    return this;
  };

  CiseauxPlayer.prototype.animation = function(t) {
    var x = (t - this.startTime) / 1000;

    x = Math.floor((x / this.duration) * CANVAS_WIDTH);

    this.context.save();
    this.context.fillStyle = "rgba(236, 240, 241, 0.1)";
    this.context.fillRect(this.prevx + 1, 0, x - this.prevx, CANVAS_HEIGHT);
    this.context.restore();

    this.prevx = x;

    if (this.isPlaying) {
      requestAnimationFrame(function(t) {
        this.animation(t);
      }.bind(this));
    }

    return this;
  };

  global.CiseauxPlayer = CiseauxPlayer;

})(this);
