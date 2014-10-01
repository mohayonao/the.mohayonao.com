(function() {
  'use strict';
  var Impulse, Integrator;

  Impulse = (function() {
    function Impulse(context) {
      this.context = context;
      this.destination = this.context.destination;
      this._node = null;
    }

    Impulse.prototype.connect = function(node) {
      return this.destination = node;
    };

    Impulse.prototype.start = function(t) {
      var bufSrc, buffer;
      buffer = this.context.createBuffer(1, 4, this.context.sampleRate);
      buffer.getChannelData(0).set(new Float32Array([1]));
      bufSrc = this.context.createBufferSource();
      bufSrc.buffer = buffer;
      bufSrc.start(t);
      if (this.destination.getOutlet) {
        bufSrc.connect(this.destination.getOutlet());
      } else {
        bufSrc.connect(this.destination);
      }
      bufSrc.onended = (function(_this) {
        return function(e) {
          return typeof _this.onend === "function" ? _this.onend(e) : void 0;
        };
      })(this);
      return this._node = bufSrc;
    };

    Impulse.prototype.stop = function() {
      var _ref;
      if ((_ref = this._node) != null) {
        _ref.disconnect();
      }
      return this._node = null;
    };

    return Impulse;

  })();

  Integrator = (function() {
    function Integrator(context, coef) {
      this.context = context;
      this.coef = coef;
      this.destination = this.context.destination;
      this._node = null;
    }

    Integrator.prototype.getOutlet = function() {
      return this._node;
    };

    Integrator.prototype.connect = function(node) {
      return this.destination = node;
    };

    Integrator.prototype.start = function(_in) {
      var delay, leak, out;
      out = this.context.createGain();
      delay = this.context.createDelay(128 / this.context.sampleRate);
      leak = this.context.createGain();
      delay.delayTime = 1 / this.context.sampleRate;
      leak.gain.value = this.coef;
      _in.connect(out);
      out.connect(delay);
      delay.connect(leak);
      leak.connect(out);
      out.connect(this.destination);
      return this._node = out;
    };

    Integrator.prototype.stop = function() {};

    return Integrator;

  })();

  $(function() {
    var context, count, scpNode;
    context = new AudioContext();
    scpNode = context.createScriptProcessor(1024, 1, 1);
    scpNode.connect(context.destination);
    count = 0;
    scpNode.onaudioprocess = function(e) {
      var i, impulsed, out, _i;
      out = e.outputBuffer.getChannelData(0);
      out.set(e.inputBuffer.getChannelData(0));
      impulsed = -1;
      for (i = _i = 0; _i < 1024; i = ++_i) {
        if (out[i] !== 0) {
          impulsed = i;
        }
      }
      if (impulsed !== -1 && count < 10) {
        console.log(impulsed, new Float32Array(out));
        return count += 1;
      }
    };
    return $('#play').on('click', function() {
      var impulse, integrator;
      impulse = new Impulse(context);
      integrator = new Integrator(context, 1);
      impulse.connect(integrator);
      integrator.connect(scpNode);
      impulse.onend = function(e) {
        return impulse.stop();
      };
      integrator.start(impulse);
      return impulse.start(context.currentTime);
    });
  });

}).call(this);
