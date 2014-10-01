(function() {
  'use strict';
  var Impulse;

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
      bufSrc.connect(this.destination);
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

  $(function() {
    var context, scpNode;
    context = new AudioContext();
    scpNode = context.createScriptProcessor(1024, 1, 1);
    scpNode.connect(context.destination);
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
      if (impulsed !== -1) {
        return console.log(impulsed, new Float32Array(out));
      }
    };
    return $('#play').on('click', function() {
      var impulse;
      impulse = new Impulse(context);
      impulse.connect(scpNode);
      impulse.onend = function(e) {
        return impulse.stop();
      };
      return impulse.start(context.currentTime);
    });
  });

}).call(this);
