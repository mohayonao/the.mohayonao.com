(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var neume = require("./src/neume");

neume.use(require("./src/ugen/index"));

if (typeof window !== "undefined") {
  window.neume = neume.exports;
}

module.exports = neume;

},{"./src/neume":10,"./src/ugen/index":32}],2:[function(require,module,exports){
"use strict";

var _ = require("./utils");
var FFT = require("./fft");

function NeuBuffer(context, buffer) {
  this.$context = context;
  this.$buffer = buffer;

  Object.defineProperties(this, {
    sampleRate: {
      value: this.$buffer.sampleRate,
      enumerable: true
    },
    length: {
      value: this.$buffer.length,
      enumerable: true
    },
    duration: {
      value: this.$buffer.duration,
      enumerable: true
    },
    numberOfChannels: {
      value: this.$buffer.numberOfChannels,
      enumerable: true
    },
  });

  for (var i = 0; i < this.$buffer.numberOfChannels; i++) {
    Object.defineProperty(this, i, {
      value: this.$buffer.getChannelData(i)
    });
  }
}
NeuBuffer.$name = "NeuBuffer";

NeuBuffer.create = function(context, channels, length, sampleRate) {
  channels   = _.int(_.defaults(channels, 1));
  length     = _.int(_.defaults(length, 0));
  sampleRate = _.int(_.defaults(sampleRate, context.sampleRate));

  return new NeuBuffer(context, context.createBuffer(channels, length, sampleRate));
};

NeuBuffer.from = function(context, data) {
  var buffer = context.createBuffer(1, data.length, context.sampleRate);
  var chData = buffer.getChannelData(0);

  for (var i = 0, imax = data.length; i < imax; i++) {
    chData[i] = data[i];
  }

  return new NeuBuffer(context, buffer);
};

NeuBuffer.load = function(context, url) {
  return new window.Promise(function(resolve, reject) {
    loadWithXHR(url).then(function(audioData) {
      return decodeAudioData(context, audioData);
    }).then(function(decodedData) {
      resolve(new NeuBuffer(context, decodedData));
    }).catch(function(e) {
      reject(e);
    });
  });
};

function loadWithXHR(url) {
  return new window.Promise(function(resolve, reject) {
    var xhr = new window.XMLHttpRequest();

    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";

    xhr.onload = function() {
      resolve(xhr.response);
    };

    xhr.onerror = function() {
      reject({/* TODO: error object */});
    };

    xhr.send();
  });
}

function decodeAudioData(context, audioData) {
  return new window.Promise(function(resolve, reject) {
    _.findAudioContext(context).decodeAudioData(audioData, function(decodedData) {
      resolve(decodedData);
    }, function() {
      reject({/* TODO: error object */});
    });
  });
}

NeuBuffer.prototype.getChannelData = function(ch) {
  ch = _.clip(_.int(ch), 0, this.numberOfChannels - 1);

  return this.$buffer.getChannelData(ch);
};

NeuBuffer.prototype.concat = function() {
  var args = _.toArray(arguments).filter(function(elem) {
    return (elem instanceof NeuBuffer) && (this.numberOfChannels === elem.numberOfChannels);
  }, this);
  var channels = this.numberOfChannels;
  var length = args.reduce(function(a, b) {
    return a + b.length;
  }, this.length);
  var sampleRate = this.sampleRate;
  var buffer = this.$context.createBuffer(channels, length, sampleRate);

  args.unshift(this);

  var argslen = args.length;

  for (var i = 0; i < channels; i++) {
    var data = buffer.getChannelData(i);
    var pos  = 0;
    for (var j = 0; j < argslen; j++) {
      data.set(args[j][i], pos);
      pos += args[j].length;
    }
  }

  return new NeuBuffer(this.$context, buffer);
};

NeuBuffer.prototype.reverse = function() {
  var channels = this.numberOfChannels;
  var buffer = this.$context.createBuffer(channels, this.length, this.sampleRate);

  for (var i = 0; i < channels; i++) {
    buffer.getChannelData(i).set(_.toArray(this[i]).reverse());
  }

  return new NeuBuffer(this.$context, buffer);
};

NeuBuffer.prototype.slice = function(start, end) {
  start = _.int(_.defaults(start, 0));
  end   = _.int(_.defaults(end  , this.length));

  if (start < 0) {
    start += this.length;
  } else {
    start = Math.min(start, this.length);
  }
  if (end < 0) {
    end += this.length;
  } else {
    end = Math.min(end, this.length);
  }

  var channels = this.numberOfChannels;
  var length = end - start;
  var sampleRate = this.sampleRate;
  var buffer = null;

  if (length <= 0) {
    buffer = this.$context.createBuffer(channels, 1, sampleRate);
  } else {
    buffer = this.$context.createBuffer(channels, length, sampleRate);
    for (var i = 0; i < channels; i++) {
      buffer.getChannelData(i).set(this[i].subarray(start, end));
    }
  }

  return new NeuBuffer(this.$context, buffer);
};

NeuBuffer.prototype.split = function(n) {
  n = _.int(_.defaults(n, 2));

  if (n <= 0) {
    return [];
  }

  var result = new Array(n);
  var len = this.length / n;
  var start = 0;
  var end   = 0;

  for (var i = 0; i < n; i++) {
    end = Math.round(start + len);
    result[i] = this.slice(start, end);
    start = end;
  }

  return result;
};

NeuBuffer.prototype.normalize = function() {
  var channels = this.numberOfChannels;
  var buffer = this.$context.createBuffer(channels, this.length, this.sampleRate);

  for (var i = 0; i < channels; i++) {
    buffer.getChannelData(i).set(normalize(this[i]));
  }

  return new NeuBuffer(this.$context, buffer);
};

NeuBuffer.prototype.resample = function(size, interpolation) {
  size = Math.max(0, _.int(_.defaults(size, this.length)));
  interpolation = !interpolation;

  var channels = this.numberOfChannels;
  var buffer = this.$context.createBuffer(channels, size, this.sampleRate);

  for (var i = 0; i < channels; i++) {
    buffer.getChannelData(i).set(resample(this[i], size, interpolation));
  }

  return new NeuBuffer(this.$context, buffer);
};

NeuBuffer.prototype.toPeriodicWave = function(ch) {
  ch = Math.max(0, Math.min(_.int(ch), this.numberOfChannels - 1));

  var buffer = this.$buffer.getChannelData(ch);

  if (4096 < buffer.length) {
    buffer = buffer.subarray(0, 4096);
  }

  var fft = FFT.forward(buffer);

  return this.$context.createPeriodicWave(fft.real, fft.imag);
};

function normalize(data) {
  var maxamp = peak(data);

  /* istanbul ignore else */
  if (maxamp !== 0) {
    var ampfac = 1 / maxamp;
    for (var i = 0, imax = data.length; i < imax; ++i) {
      data[i] *= ampfac;
    }
  }

  return data;
}

function peak(data) {
  var maxamp = 0;

  for (var i = 0, imax = data.length; i < imax; ++i) {
    var absamp = Math.abs(data[i]);
    if (maxamp < absamp) {
      maxamp = absamp;
    }
  }

  return maxamp;
}

function resample(data, size, interpolation) {
  if (data.length === size) {
    return new Float32Array(data);
  }

  if (interpolation) {
    return resample0(data, size);
  }

  return resample1(data, size);
}

function resample0(data, size) {
  var factor = (data.length - 1) / (size - 1);
  var result = new Float32Array(size);

  for (var i = 0; i < size; i++) {
    result[i] = data[Math.round(i * factor)];
  }

  return result;
}

function resample1(data, size) {
  var factor = (data.length - 1) / (size - 1);
  var result = new Float32Array(size);
  var len = data.length - 1;

  for (var i = 0; i < size; i++) {
    var x  = i * factor;
    var x0 = x|0;
    var x1 = Math.min(x0 + 1, len);
    result[i] = data[x0] + Math.abs(x - x0) * (data[x1] - data[x0]);
  }

  return result;
}

module.exports = NeuBuffer;

},{"./fft":7,"./utils":45}],3:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var INIT  = 0;
var START = 1;
var BUFFER_SIZE = 1024;
var MAX_RENDERING_SEC = 180;

var schedId = 1;

function NeuContext(destination, duration) {
  this.$context = destination.context;
  this.$destination = destination;

  Object.defineProperties(this, {
    sampleRate: {
      value: this.$context.sampleRate,
      enumerable: true
    },
    currentTime: {
      get: function() {
        return this._currentTime || this.$context.currentTime;
      },
      enumarable: true
    },
    destination: {
      value: destination,
      enumerable: true
    },
    listener: {
      value: this.$context.listener,
      enumerable: true
    }
  });

  this._duration = duration;
  this.reset();
}
NeuContext.$name = "NeuContext";

_.each([
  "createBuffer",
  "createBufferSource",
  "createMediaElementSource",
  "createMediaStreamSource",
  "createMediaStreamDestination",
  "createScriptProcessor",
  "createAnalyser",
  "createGain",
  "createDelay",
  "createBiquadFilter",
  "createWaveShaper",
  "createPanner",
  "createConvolver",
  "createChannelSplitter",
  "createChannelMerger",
  "createDynamicsCompressor",
  "createOscillator",
], function(methodName) {
  NeuContext.prototype[methodName] = function() {
    return this.$context[methodName].apply(this.$context, arguments);
  };
});

NeuContext.prototype.createPeriodicWave = function() {
  var context = this.$context;
  return (context.createPeriodicWave || context.createWaveTable).apply(context, arguments);
};

NeuContext.prototype.getMasterGain = function() {
  return this._masterGain;
};

NeuContext.prototype.getAnalyser = function() {
  return this._analyser;
};

NeuContext.prototype.reset = function() {
  if (this.$outlet) {
    this.$outlet.disconnect();
  }

  this._masterGain = this.$context.createGain();
  this._analyser   = this.$context.createAnalyser();

  _.connect({ from: this._masterGain, to: this._analyser });
  _.connect({ from: this._analyser  , to: this.$destination });

  this.$outlet = this._masterGain;

  if (this._scriptProcessor) {
    this._scriptProcessor.disconnect();
  }
  this._events = [];
  this._nextTicks = [];
  this._state = INIT;
  this._currentTime = 0;
  this._scriptProcessor = null;

  return this;
};

NeuContext.prototype.start = function() {
  if (this._state === INIT) {
    this._state = START;
    if (this.$context instanceof window.OfflineAudioContext) {
      startRendering.call(this);
    } else {
      startAudioTimer.call(this);
    }
  }
  return this;
};

function startRendering() {
  this._currentTimeIncr = _.clip(_.finite(this._duration), 0, MAX_RENDERING_SEC);
  onaudioprocess.call(this, { playbackTime: 0 });
}

function startAudioTimer() {
  var context = this.$context;
  var scriptProcessor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
  var bufferSource    = context.createBufferSource();

  this._currentTimeIncr = BUFFER_SIZE / context.sampleRate;
  this._scriptProcessor = scriptProcessor;
  scriptProcessor.onaudioprocess = onaudioprocess.bind(this);

  // this is needed for iOS Safari
  bufferSource.start(0);
  _.connect({ from: bufferSource, to: scriptProcessor });

  _.connect({ from: scriptProcessor, to: context.destination });
}

NeuContext.prototype.stop = function() {
  return this;
};

NeuContext.prototype.sched = function(time, callback, ctx) {
  time = _.finite(time);

  if (!_.isFunction(callback)) {
    return 0;
  }

  var events = this._events;
  var event  = {
    id      : schedId++,
    time    : time,
    callback: callback,
    context : ctx || this
  };

  if (events.length === 0 || _.last(events).time <= time) {
    events.push(event);
  } else {
    for (var i = 0, imax = events.length; i < imax; i++) {
      if (time < events[i].time) {
        events.splice(i, 0, event);
        break;
      }
    }
  }

  return event.id;
};

NeuContext.prototype.unsched = function(id) {
  id = _.finite(id);

  if (id !== 0) {
    var events = this._events;
    for (var i = 0, imax = events.length; i < imax; i++) {
      if (id === events[i].id) {
        events.splice(i, 1);
        break;
      }
    }
  }

  return id;
};

NeuContext.prototype.nextTick = function(callback, ctx) {
  this._nextTicks.push(callback.bind(ctx || this));
  return this;
};

function onaudioprocess(e) {
  // Safari 7.0.6 does not support e.playbackTime
  var currentTime     = e.playbackTime || /* istanbul ignore next */ this.$context.currentTime;
  var nextCurrentTime = currentTime + this._currentTimeIncr;
  var events = this._events;

  this._currentTime = currentTime;

  this._nextTicks.splice(0).forEach(function(callback) {
    callback(currentTime);
  });

  while (events.length && events[0].time <= nextCurrentTime) {
    var event = events.shift();

    this._currentTime = Math.max(this._currentTime, event.time);

    event.callback.call(event.context, event.time);
  }
}

module.exports = NeuContext;

},{"./utils":45}],4:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var BUFLENGTH = 128;
var filled0 = _.fill(new Float32Array(BUFLENGTH), 0);
var filled1 = _.fill(new Float32Array(BUFLENGTH), 1);

/**
 * Create a constant amplitude signal
 *
 * @param {AudioContext} context
 * @param {number}       value
 */
function NeuDC(context, value) {
  value = _.num(value);

  var buf = context.createBuffer(1, BUFLENGTH, context.sampleRate);
  var bufSrc = context.createBufferSource();

  buf.getChannelData(0).set(
    value === 0 ? filled0 :
    value === 1 ? filled1 :
    _.fill(new Float32Array(BUFLENGTH), value)
  );

  bufSrc.buffer = buf;
  bufSrc.loop   = true;
  bufSrc.start(0);

  this._bufSrc = bufSrc;
  this.$context = this._bufSrc.context;
  this.$outlet  = this._bufSrc;
}
NeuDC.$name = "NeuDC";

/**
 * @return {number} value
 */
NeuDC.prototype.valueOf = function() {
  return this._bufSrc.buffer.getChannelData(0)[0];
};

module.exports = NeuDC;

},{"./utils":45}],5:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuDC = require("./dc");

function NeuDryWet(context, inputs, wetNode, mix) {
  if (typeof mix === "number") {
    return new DryWetNumber(context, inputs, wetNode, mix);
  }
  return new DryWetNode(context, inputs, wetNode, mix);
}

function DryWetNode(context, inputs, wetNode, mix) {
  var dc1 = new NeuDC(context, 1);

  var wetGain = context.createGain();
  var dryGain = context.createGain();
  var negGain = context.createGain();
  var mixGain = context.createGain();

  wetGain.gain.value = 0;
  dryGain.gain.value = 0;
  negGain.gain.value = -1;

  for (var i = 0, imax = inputs.length; i < imax; i++) {
    _.connect({ from: inputs[i], to: wetNode });
    _.connect({ from: inputs[i], to: dryGain });
  }

  _.connect({ from: wetNode, to: wetGain });
  _.connect({ from: wetGain, to: mixGain });
  _.connect({ from: dryGain, to: mixGain });

  _.connect({ from: mix, to: wetGain.gain });
  _.connect({ from: mix, to: negGain });
  _.connect({ from: dc1    , to: dryGain.gain }); // +1
  _.connect({ from: negGain, to: dryGain.gain }); // -mix

  mixGain.$maddOptimizable = true;

  return mixGain;
}

function DryWetNumber(context, inputs, wetNode, mix) {
  mix = _.clip(mix, 0, 1);

  var wet = mix;
  var dry = 1 - mix;
  var i, imax;

  if (wet === 1) {
    for (i = 0, imax = inputs.length; i < imax; i++) {
      _.connect({ from: inputs[i], to: wetNode });
    }
    return wetNode;
  }

  if (dry === 1) {
    if (inputs.length === 1) {
      return inputs[0];
    }
    return sum(context, inputs);
  }

  var wetGain = context.createGain();
  var dryGain = context.createGain();
  var mixGain = context.createGain();

  wetGain.gain.value = wet;
  dryGain.gain.value = dry;

  for (i = 0, imax = inputs.length; i < imax; i++) {
    _.connect({ from: inputs[i], to: wetNode });
    _.connect({ from: inputs[i], to: dryGain });
  }
  _.connect({ from: wetNode, to: wetGain });
  _.connect({ from: wetGain, to: mixGain });
  _.connect({ from: dryGain, to: mixGain });

  mixGain.$maddOptimizable = true;

  return mixGain;
}

function sum(context, inputs) {
  var result = context.createGain();

  for (var i = 0, imax = inputs.length; i < imax; i++) {
    _.connect({ from: inputs[i], to: result });
  }
  result.$maddOptimizable = true;

  return result;
}

module.exports = NeuDryWet;

},{"./dc":4,"./utils":45}],6:[function(require,module,exports){
"use strict";

function Emitter() {
  this._callbacks = {};
}

Emitter.prototype.hasListeners = function(event) {
  return this._callbacks.hasOwnProperty(event);
};

Emitter.prototype.listeners = function(event) {
  return this.hasListeners(event) ? this._callbacks[event].slice() : [];
};

Emitter.prototype.on = function(event, listener) {

  if (!this.hasListeners(event)) {
    this._callbacks[event] = [];
  }

  this._callbacks[event].push(listener);

  return this;
};

Emitter.prototype.once = function(event, listener) {

  function fn(payload) {
    this.off(event, fn);
    listener.call(this, payload);
  }

  fn.listener = listener;

  this.on(event, fn);

  return this;
};

Emitter.prototype.off = function(event, listener) {

  if (typeof listener === "undefined") {
    if (typeof event === "undefined") {
      this._callbacks = {};
    } else if (this.hasListeners(event)) {
      delete this._callbacks[event];
    }
  } else if (this.hasListeners(event)) {
    this._callbacks[event] = this._callbacks[event].filter(function(fn) {
      return !(fn === listener || fn.listener === listener);
    });
  }

  return this;
};

Emitter.prototype.emit = function(event, payload, ctx) {
  this.listeners(event).forEach(function(fn) {
    fn.call(this, payload);
  }, ctx || this);
};

module.exports = Emitter;

},{}],7:[function(require,module,exports){
"use strict";

var _ = require("./utils");

function forward(_buffer) {
  var n = 1 << Math.ceil(Math.log(_.finite(_buffer.length)) * Math.LOG2E);
  var buffer = new Float32Array(n);
  var real   = new Float32Array(n);
  var imag   = new Float32Array(n);
  var params = getParams(n);
  var bitrev = params.bitrev;
  var sintable = params.sintable;
  var costable = params.costable;
  var i, j, k, k2, h, d, c, s, ik, dx, dy;

  for (i = 0; i < n; i++) {
    buffer[i] = _buffer[i];
    real[i]   = _buffer[bitrev[i]];
    imag[i]   = 0.0;
  }

  for (k = 1; k < n; k = k2) {
    h = 0;
    k2 = k + k;
    d = n / k2;
    for (j = 0; j < k; j++) {
      c = costable[h];
      s = sintable[h];
      for (i = j; i < n; i += k2) {
        ik = i + k;
        dx = s * imag[ik] + c * real[ik];
        dy = c * imag[ik] - s * real[ik];
        real[ik] = real[i] - dx;
        imag[ik] = imag[i] - dy;
        real[i] += dx;
        imag[i] += dy;
      }
      h += d;
    }
  }

  return { real: real, imag: imag };
}

function inverse(_real, _imag) {
  var n = 1 << Math.ceil(Math.log(_.finite(_real.length)) * Math.LOG2E);
  var buffer = new Float32Array(n);
  var real   = new Float32Array(n);
  var imag   = new Float32Array(n);
  var params = getParams(n);
  var bitrev = params.bitrev;
  var sintable = params.sintable;
  var costable = params.costable;
  var i, j, k, k2, h, d, c, s, ik, dx, dy;

  for (i = 0; i < n; i++) {
    j = bitrev[i];
    real[i] = +_real[j];
    imag[i] = -_imag[j];
  }

  for (k = 1; k < n; k = k2) {
    h = 0;
    k2 = k + k;
    d = n / k2;
    for (j = 0; j < k; j++) {
      c = costable[h];
      s = sintable[h];
      for (i = j; i < n; i += k2) {
        ik = i + k;
        dx = s * imag[ik] + c * real[ik];
        dy = c * imag[ik] - s * real[ik];
        real[ik] = real[i] - dx;
        imag[ik] = imag[i] - dy;
        real[i] += dx;
        imag[i] += dy;
      }
      h += d;
    }
  }

  for (i = 0; i < n; i++) {
    buffer[i] = real[i] / n;
  }

  return buffer;
}

function calcBitRev(n) {
  var x = new Int16Array(n);

  var n2 = n >> 1;
  var i = 0;
  var j = 0;

  while (true) {
    x[i] = j;

    if (++i >= n) {
      break;
    }

    var k = n2;

    while (k <= j) {
      j -= k;
      k >>= 1;
    }

    j += k;
  }

  return x;
}

function getParams(n) {
  if (getParams.cache[n]) {
    return getParams.cache[n];
  }

  var bitrev = calcBitRev(n);
  var k = Math.floor(Math.log(n) / Math.LN2);
  var sintable = new Float32Array((1 << k) - 1);
  var costable = new Float32Array((1 << k) - 1);

  for (var i = 0, imax = sintable.length; i < imax; i++) {
    sintable[i] = Math.sin(Math.PI * 2 * (i / n));
    costable[i] = Math.cos(Math.PI * 2 * (i / n));
  }

  getParams.cache[n] = {
    bitrev  : bitrev,
    sintable: sintable,
    costable: costable,
  };

  return getParams.cache[n];
}
getParams.cache = [];

module.exports = {
  forward: forward,
  inverse: inverse,
};

},{"./utils":45}],8:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuNode = require("./node");

function NeuIn(synth) {
  NeuNode.call(this, synth);

  this.$outlet  = this.$context.createGain();
  this.$offset  = 0;
}
_.inherits(NeuIn, NeuNode);

NeuIn.$name = "NeuIn";

module.exports = _.NeuIn = NeuIn;

},{"./node":11,"./utils":45}],9:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var INIT  = 0;
var START = 1;
var STOP  = 2;

function NeuInterval(context, interval, callback) {
  interval = _.finite(interval);

  this.$context = context;

  this._interval = Math.max(1 / context.sampleRate, interval);
  this._callback = callback;
  this._oninterval = oninterval.bind(this);
  this._state = INIT;
  this._stateString = "UNSCHEDULED";
  this._startTime = 0;
  this._stopTime = Infinity;
  this._count = 0;

  Object.defineProperties(this, {
    context: {
      value: _.findAudioContext(this.$context),
      enumerable: true
    },
    outlet: {
      value: null,
      enumerable: true
    },
    state: {
      get: function() {
        return this._stateString;
      },
      enumerable: true
    },
  });
}
NeuInterval.$name = "NeuInterval";

NeuInterval.prototype.start = function(t) {
  t = _.defaults(t, this.$context.currentTime);

  if (this._state === INIT) {
    this._state = START;
    this._stateString = "SCHEDULED";
    this._startTime = t;

    if (_.isFunction(this._callback)) {
      this.$context.sched(this._startTime, function(t) {
        this._stateString = "PLAYING";
        this._oninterval(t);
      }, this);
    }

    this.$context.start(); // auto start(?)
  }

  return this;
};

NeuInterval.prototype.stop = function(t) {
  t = _.defaults(t, this.$context.currentTime);

  if (this._state === START) {
    this._state = STOP;
    this._stopTime = t;
    this.$context.sched(this._stopTime, function() {
      this._stateString = "FINISHED";
    }, this);
  }

  return this;
};

function oninterval(t) {
  if (t < this._stopTime) {
    this._callback({ playbackTime: t, count: this._count++ });

    var nextTime = this._startTime + this._interval * this._count;
    this.$context.sched(nextTime, this._oninterval);
  }
}

module.exports = NeuInterval;

},{"./utils":45}],10:[function(require,module,exports){
"use strict";

// Safari 7.0.6  needs webkit prefix
window.AudioContext = window.AudioContext || /* istanbul ignore next */ window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || /* istanbul ignore next */ window.webkitOfflineAudioContext;

var _ = require("./utils");

var neume = function(context) {
  function Neume(spec) {
    return new neume.SynthDef(context, spec);
  }

  Object.defineProperties(Neume, {
    context: {
      value: context.$context,
      enumerable: true
    },
    destination: {
      value: context.$destination,
      enumerable: true
    },
    sampleRate: {
      value: context.sampleRate,
      enumerable: true
    },
    currentTime: {
      get: function() {
        return context.currentTime;
      },
      enumerable: true
    },
    Buffer: {
      value: Object.defineProperties(function(channels, length, sampleRate) {
        return neume.Buffer.create(context, channels, length, sampleRate);
      }, {
        from: {
          value: function(data) {
            return neume.Buffer.from(context, data);
          },
          enumerable: true
        },
        load: {
          value: function(url) {
            return neume.Buffer.load(context, url);
          },
          enumerable: true
        }
      }),
      enumerable: true
    },
    Interval: {
      value: function(interval, callback) {
        return new neume.Interval(context, interval, callback);
      },
      enumerable: true
    },
  });

  return Neume;
};

neume._ = _;
neume.Context  = require("./context");
neume.SynthDef = require("./synthdef");
neume.Synth    = require("./synth");
neume.UGen     = require("./ugen");
neume.Param    = require("./param");
neume.Unit     = require("./unit");
neume.DC       = require("./dc");
neume.Buffer   = require("./buffer");
neume.DryWet   = require("./drywet");
neume.Interval = require("./interval");

neume.register = function(name, func) {
  neume.UGen.register(name, func);
  return neume;
};

neume.use = function(fn) {
  /* istanbul ignore else */
  if (neume.use.used.indexOf(fn) === -1) {
    fn(neume, _);
    neume.use.used.push(fn);
  }
  return neume;
};
neume.use.used = [];

neume.render = function(context, duration, func) {
  var sampleRate = context.sampleRate;
  var length     = _.int(sampleRate * duration);

  return new Promise(function(resolve) {
    var audioContext = new window.OfflineAudioContext(2, length, sampleRate);
    audioContext.oncomplete = function(e) {
      resolve(new neume.Buffer(context, e.renderedBuffer));
    };
    func(neume(new neume.Context(audioContext.destination, duration)));
    audioContext.startRendering();
  });
};

neume.exports = function(destination) {
  if (destination instanceof window.AudioContext) {
    destination = destination.destination;
  }
  if (!(destination instanceof window.AudioNode)) {
    throw new TypeError("neume(): illegal argument");
  }

  var context = new neume.Context(destination);

  return Object.defineProperties(
    neume(context), {
      use: {
        value: neume.use,
        enumerable: true
      },
      render: {
        value: function(duration, func) {
          return neume.render(context, duration, func);
        },
        enumerable: true
      },
      master: {
        get: function() {
          return context.getMasterGain();
        },
        enumerable: true
      },
      analyser: {
        get: function() {
          return context.getAnalyser();
        },
        enumerable: true
      }
    }
  );
};

module.exports = neume;

},{"./buffer":2,"./context":3,"./dc":4,"./drywet":5,"./interval":9,"./param":12,"./synth":15,"./synthdef":17,"./ugen":20,"./unit":44,"./utils":45}],11:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var Emitter = require("./emitter");

function NeuNode(synth) {
  Emitter.call(this);

  this.$synth   = synth;
  this.$context = synth.$context;
}
_.inherits(NeuNode, Emitter);

NeuNode.$name = "NeuNode";

NeuNode.prototype.add = function(node) {
  return new _.NeuUGen(this.$synth, "+", {}, [ this, _.defaults(node, 0) ]);
};

NeuNode.prototype.mul = function(node) {
  return new _.NeuUGen(this.$synth, "*", {}, [ this, _.defaults(node, 1) ]);
};

NeuNode.prototype.madd = function(mul, add) {
  return this.mul(_.defaults(mul, 1)).add(_.defaults(add, 0));
};

module.exports = _.NeuNode = NeuNode;

},{"./emitter":6,"./utils":45}],12:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuNode = require("./node");
var NeuDC   = require("./dc");

function NeuParam(synth, name, value) {
  NeuNode.call(this, synth);

  this.name = name;

  this.$outlet = null;
  this.$offset = 0;

  this._params = [];
  this._connected = [];
  this._value = _.finite(value);
}
_.inherits(NeuParam, NeuNode);

NeuParam.$name = "NeuParam";

NeuParam.prototype.valueOf = function() {
  return this._params.length ? this._params[0].value : /* istanbul ignore next */ this._value;
};

NeuParam.prototype.set = function(value) {
  value = _.finite(value);

  var startTime = this.$context.currentTime;
  var params = this._params;

  this._value = value;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].value = value;
    params[i].setValueAtTime(value, startTime);
  }

  return this;
};

NeuParam.prototype.setAt = function(value, startTime) {
  value     = _.finite(value);
  startTime = _.finite(startTime);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].setValueAtTime(value, startTime);
  }

  return this;
};

NeuParam.prototype.linTo = function(value, endTime) {
  value   = _.finite(value);
  endTime = _.finite(endTime);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].linearRampToValueAtTime(value, endTime);
  }

  return this;
};

NeuParam.prototype.expTo = function(value, endTime) {
  value   = _.finite(value);
  endTime = _.finite(endTime);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].exponentialRampToValueAtTime(value, endTime);
  }

  return this;
};

NeuParam.prototype.targetAt = function(target, startTime, timeConstant) {
  target       = _.finite(target);
  startTime    = _.finite(startTime);
  timeConstant = _.finite(timeConstant);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].setTargetAtTime(target, startTime, timeConstant);
  }

  return this;
};

NeuParam.prototype.curveAt = function(values, startTime, duration) {
  startTime = _.finite(startTime);
  duration  = _.finite(duration);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].setValueCurveAtTime(values, startTime, duration);
  }

  return this;
};

NeuParam.prototype.cancel = function(startTime) {
  startTime = _.finite(startTime);

  var params = this._params;

  for (var i = 0, imax = params.length; i < imax; i++) {
    params[i].cancelScheduledValues(startTime);
  }

  return this;
};

NeuParam.prototype._connect = function(to, output, input) {
  if (this._connected.indexOf(to) !== -1) {
    return; // if already connected
  }
  this._connected.push(to);

  if (to instanceof window.AudioParam) {
    to.value = this._value;
    to.setValueAtTime(this._value, 0);
    this._params.push(to);
  } else {
    if (this.$outlet == null) {
      this.$outlet = this.$context.createGain();
      this.$outlet.gain.setValueAtTime(this._value, 0);
      this._params.push(this.$outlet.gain);
      _.connect({ from: new NeuDC(this.$context, 1), to: this.$outlet });
    }
    _.connect({ from: this.$outlet, to: to, input: input });
  }
};

module.exports = _.NeuParam = NeuParam;

},{"./dc":4,"./node":11,"./utils":45}],13:[function(require,module,exports){
"use strict";

var reUGenName = /^([a-zA-Z](-?[a-zA-Z0-9]+)*!?\??|[-+*\/%<=>!?&|@]+)/;

function isValidUGenName(name) {
  var exec = reUGenName.exec(name);
  return !!exec && exec[0] === name;
}

function parse(selector) {
  selector = String(selector);

  var parsed = { key: "", id: null, class: [] };

  var keyMatched = selector.match(reUGenName);
  if (keyMatched) {
    parsed.key = keyMatched[0];
    selector = selector.substr(parsed.key.length);
  }

  var matched = selector.match(/[.#][a-zA-Z](-?[a-zA-Z0-9]+)*/g);
  if (matched) {
    matched.forEach(function(match) {
      var ch0 = match.charAt(0);
      if (ch0 === "#") {
        if (!parsed.id) {
          parsed.id = match.substr(1);
        }
      } else {
        parsed.class.push(match.substr(1));
      }
    });
  }

  return parsed;
}

module.exports = {
  isValidUGenName: isValidUGenName,
  parse: parse
};

},{}],14:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuDC   = require("./dc");
var NeuUGen = require("./ugen");

function makeOutlet(context, ugen) {
  var outlet = null;

  if (ugen instanceof NeuUGen) {
    var offset = _.finite(ugen.$offset);

    if (offset === 0) {
      outlet = ugen.$outlet;
    } else {
      var dc = createGainDC(context, offset);
      if (ugen.$outlet) {
        outlet = sum(context, ugen.$outlet, dc);
      } else {
        outlet = dc;
      }
    }
  }

  return outlet;
}

function createGainDC(context, offset) {
  var gain = context.createGain();

  gain.gain.value = offset;

  _.connect({ from: new NeuDC(context, 1), to: gain });

  return gain;
}

function sum(context, outlet, dc) {
  var gain = context.createGain();

  _.connect({ from: outlet, to: gain });
  _.connect({ from: dc    , to: gain });

  return gain;
}

module.exports = makeOutlet;

},{"./dc":4,"./ugen":20,"./utils":45}],15:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuSynthDB     = require("./synthdb");
var NeuSynthDollar = require("./synthdollar");
var makeOutlet     = require("./synth-makeOutlet");

var EMPTY_DB = new NeuSynthDB();
var INIT  = 0;
var START = 1;
var STOP  = 2;

function NeuSynth(context, func, args) {
  this.$context = context;

  var $ = new NeuSynthDollar(this);
  var result = makeOutlet(context, func.apply(null, [ $.builder ].concat(args)));

  if ($.outputs[0] == null) {
    $.outputs[0] = result;
  }

  this.$inputs  = $.inputs;
  this.$outputs = $.outputs;
  this._routing = [];
  this._db = $.outputs.length ? $.db : EMPTY_DB;
  this._state = INIT;
  this._stateString = "UNSCHEDULED";
  this._timers = $.timers;
  this._methodNames = [];

  Object.defineProperties(this, {
    context: {
      value: _.findAudioContext(this.$context),
      enumerable: true
    },
    currentTime: {
      get: function() {
        return this.$context.currentTime;
      },
      enumerable: true
    },
    outlet: {
      value: _.findAudioNode(this.$outputs[0]),
      enumerable: true
    },
    state: {
      get: function() {
        return this._stateString;
      },
      enumerable: true
    },
  });

  _.each($.methods, function(method, methodName) {
    this._methodNames.push(methodName);
    Object.defineProperty(this, methodName, {
      value: function() {
        method.apply(this, _.toArray(arguments));
      }
    });
  }, this);

  this._db.all().forEach(function(ugen) {
    _.keys(ugen.$unit.$methods).forEach(function(methodName) {
      if (!this.hasOwnProperty(methodName)) {
        this._methodNames.push(methodName);
        Object.defineProperty(this, methodName, {
          value: function() {
            return this.apply(methodName, _.toArray(arguments));
          }
        });
      }
    }, this);
  }, this);

  this._methodNames = this._methodNames.sort();
}
NeuSynth.$name = "NeuSynth";

NeuSynth.prototype.getMethods = function() {
  return this._methodNames.slice();
};

NeuSynth.prototype.start = function(t) {
  t = _.defaults(t, this.$context.currentTime);

  if (this._state === INIT) {
    this._state = START;
    this._stateString = "SCHEDULED";

    this.$context.sched(t, function() {
      this._stateString = "PLAYING";
    }, this);

    if (this._routing.length === 0) {
      _.connect({ from: this.$outputs[0], to: this.$context.$outlet });
    } else {
      this._routing.forEach(function(destinations, output) {
        destinations.forEach(function(destination) {
          _.connect({ from: this.$outputs[output], to: destination });
        }, this);
      }, this);
    }

    this._db.all().forEach(function(ugen) {
      ugen.$unit.start(t);
    });

    this._timers.forEach(function(timer) {
      timer.start(t);
    });

    this.$context.start(); // auto start(?)
  }

  return this;
};

NeuSynth.prototype.stop = function(t) {
  t = _.defaults(t, this.$context.currentTime);

  if (this._state === START) {
    this._state = STOP;

    this.$context.sched(t, function(t) {
      this._stateString = "FINISHED";

      this.$context.nextTick(function() {
        this.$outputs.forEach(function(output) {
          _.disconnect({ from: output });
        });
      }, this);

      this._db.all().forEach(function(ugen) {
        ugen.$unit.stop(t);
      });

      this._timers.forEach(function(timer) {
        timer.stop(t);
      });
    }, this);
  }

  return this;
};

NeuSynth.prototype.apply = function(method, args) {
  iterateOverTargetss(this._db, method, function(ugen, method) {
    ugen.$unit.apply(method, args);
  });
  return this;
};

NeuSynth.prototype.call = function() {
  var args = _.toArray(arguments);
  var method = args.shift();

  return this.apply(method, args);
};

NeuSynth.prototype.connect = function(destination, output, input) {
  output = Math.max(0, _.int(output));
  input  = Math.max(0, _.int(input));

  if (destination instanceof NeuSynth && this.$outputs[output] && destination.$inputs[input]) {
    if (!this._routing[output]) {
      this._routing[output] = [];
    }
    this._routing[output].push(_.findAudioNode(destination.$inputs[input]));
  }

  return this;
};

NeuSynth.prototype.hasListeners = function(event) {
  var result = false;

  iterateOverTargetss(this._db, event, function(ugen, event) {
    result = result || ugen.hasListeners(event);
  });

  return result;
};

NeuSynth.prototype.listeners = function(event) {
  var listeners = [];

  iterateOverTargetss(this._db, event, function(ugen, event) {
    ugen.listeners(event).forEach(function(listener) {
      if (listeners.indexOf(listener) === -1) {
        listeners.push(listener);
      }
    });
  });

  return listeners;
};

NeuSynth.prototype.on = function(event, listener) {
  iterateOverTargetss(this._db, event, function(ugen, event) {
    ugen.on(event, listener);
  });
  return this;
};

NeuSynth.prototype.once = function(event, listener) {
  iterateOverTargetss(this._db, event, function(ugen, event) {
    ugen.once(event, listener);
  });
  return this;
};

NeuSynth.prototype.off = function(event, listener) {
  iterateOverTargetss(this._db, event, function(ugen, event) {
    ugen.off(event, listener);
  });
  return this;
};

function iterateOverTargetss(db, event, callback) {
  var parsed = parseEvent(event);

  if (parsed) {
    var targets = parsed.selector ? db.find(parsed.selector) : db.all();
    targets.forEach(function(ugen) {
      callback(ugen, parsed.name);
    });
  }
}

function parseEvent(event) {
  var matched = /^(?:(.*?):([a-z]\w+)|([a-z]\w+))$/.exec(event);

  if (!matched) {
    return null;
  }

  if (matched[3] != null) {
    return { selector: null, name: matched[3]};
  }

  return { selector: matched[1], name: matched[2] };
}

module.exports = NeuSynth;

},{"./synth-makeOutlet":14,"./synthdb":16,"./synthdollar":18,"./utils":45}],16:[function(require,module,exports){
"use strict";

var _ = require("./utils");
var selectorParser = require("./selector-parser");

function NeuSynthDB() {
  this._all = [];
  this._ids = {};
}

NeuSynthDB.prototype.append = function(obj) {
  if (_.isObject(obj)) {
    this._all.push(obj);
    if (_.has(obj, "$id")) {
      this._ids[obj.$id] = obj;
    }
  }
  return this;
};
NeuSynthDB.$name = "NeuSynthDB";

NeuSynthDB.prototype.all = function() {
  return this._all;
};

NeuSynthDB.prototype.find = function(selector) {
  var result = null;
  var parsed = selectorParser.parse(selector);

  if (parsed.id) {
    result = this._ids[parsed.id] ? [ this._ids[parsed.id] ] : [];
  } else {
    result = this._all;
  }

  parsed.class.forEach(function(cls) {
    result = result.filter(function(obj) {
      return obj.$class.indexOf(cls) !== -1;
    });
  });

  if (parsed.key) {
    result = result.filter(function(obj) {
      return obj.$key === parsed.key;
    });
  }

  return result;
};

module.exports = NeuSynthDB;

},{"./selector-parser":13,"./utils":45}],17:[function(require,module,exports){
"use strict";

var _ = require("./utils");

_.NeuSynth = require("./synth");

function NeuSynthDef(defaultContext, func) {
  if (!_.isFunction(func)) {
    throw new TypeError("NeuSynthDef func is not a function");
  }

  function SynthDef() {
    var context = defaultContext;
    var args = _.toArray(arguments);

    if (_.isAudioContext(_.first(args))) {
      context = _.first(args);
      args = _.rest(args);
    }

    return new _.NeuSynth(context, func, args);
  }

  Object.defineProperties(SynthDef, {
    context: {
      value: _.findAudioContext(defaultContext),
      enumerable: true
    }
  });

  return SynthDef;
}

module.exports = NeuSynthDef;

},{"./synth":15,"./utils":45}],18:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuSynthDB = require("./synthdb");
var NeuUGen = require("./ugen");
var NeuParam = require("./param");
var NeuIn = require("./in");

function NeuSynthDollar(synth) {
  var db = new NeuSynthDB();

  this.db      = db;
  this.params  = {};
  this.inputs  = [];
  this.outputs = [];
  this.methods = {};
  this.timers  = [];

  function builder() {
    var args = _.toArray(arguments);
    var key  = args.shift();
    var spec = _.isDictionary(args[0]) ? args.shift() : {};
    var inputs = Array.prototype.concat.apply([], args);
    var ugen = NeuUGen.build(synth, key, spec, inputs);

    db.append(ugen);

    return ugen;
  }

  builder.param    = $param(synth, this.params);
  builder.in       = $input(synth, this.inputs);
  builder.out      = $output(synth, this.outputs);
  builder.method   = $method(synth, this.methods);
  builder.timeout  = $timeout(synth, this.timers);
  builder.interval = $interval(synth, this.timers);

  this.builder = builder;
}

function $param(synth, params) {
  return function(name, defaultValue) {
    if (params.hasOwnProperty(name)) {
      return params[name];
    }

    defaultValue = _.finite(_.defaults(defaultValue, 0));

    validateParam(name, defaultValue);

    var param = new NeuParam(synth, name, defaultValue);

    Object.defineProperty(synth, name, {
      set: function(value) {
        param.set(value);
      },
      get: function() {
        return param;
      }
    });

    params[name] = param;

    return param;
  };
}

function $input(synth, inputs) {
  return function(index) {
    index = Math.max(0, index|0);

    if (!inputs[index]) {
      inputs[index] = new NeuIn(synth);
    }

    return inputs[index];
  };
}

function $output(synth, outputs) {
  return function(index, ugen) {
    index = Math.max(0, index|0);

    if (ugen instanceof NeuUGen) {
      outputs[index] = ugen;
    }

    return null;
  };
}

function $method(synth, methods) {
  return function(methodName, func) {
    if (/^[a-z]\w*$/.test(methodName) && typeof func === "function") {
      methods[methodName] = func;
    }
  };
}

function $timeout(synth, timers) {
  var context = synth.$context;

  return function(timeout) {
    timeout = Math.max(0, _.finite(timeout));

    var schedId   = 0;
    var callbacks = _.toArray(arguments).slice(1).filter(_.isFunction);

    function sched(t) {
      schedId = context.sched(t, function(t) {
        schedId = 0;
        for (var i = 0 , imax = callbacks.length; i < imax; i++) {
          callbacks[i].call(synth, t, 1);
        }
      });
    }

    timers.push({
      start: function(t) {
        sched(t + timeout);
      },
      stop: function() {
        context.unsched(schedId);
        schedId = 0;
      }
    });
  };
}

function $interval(synth, timers) {
  var context = synth.$context;

  return function(interval) {
    interval = Math.max(1 / context.sampleRate, _.finite(interval));

    var schedId   = 0;
    var callbacks = _.toArray(arguments).slice(1).filter(_.isFunction);
    var startTime = 0;
    var count     = 0;

    function sched(t) {
      schedId = context.sched(t, function(t) {
        schedId = 0;
        count  += 1;
        for (var i = 0, imax = callbacks.length; i < imax; i++) {
          callbacks[i].call(synth, t, count);
        }
        sched(startTime + interval * (count + 1));
      });
    }

    timers.push({
      start: function(t) {
        startTime = t;
        sched(t + interval);
      },
      stop: function() {
        context.unsched(schedId);
        schedId = 0;
      }
    });
  };
}

function validateParam(name) {
  if (!/^[a-z]\w*$/.test(name)) {
    throw new TypeError(_.format(
      "invalid parameter name: #{name}", { name: name }
    ));
  }
}

module.exports = NeuSynthDollar;

},{"./in":8,"./param":12,"./synthdb":16,"./ugen":20,"./utils":45}],19:[function(require,module,exports){
"use strict";

var _ = require("./utils");

_.NeuDC = require("./dc");

function makeOutlet(context, unit, spec) {
  unit = unit || {};

  var outlet = null;
  var offset = _.finite(unit.$offset);
  var gain;

  var mul = _.defaults(spec.mul, 1);
  var add = _.defaults(spec.add, 0);

  outlet = (mul === 0) ? null : _.findAudioNode(unit.$outlet);

  if (outlet && mul !== 1) {
    if (outlet.$maddOptimizable) {
      outlet.gain.value = mul;
      outlet.$maddOptimizable = false;
    } else {
      gain = context.createGain();
      _.connect({ from: outlet, to: gain });
      _.connect({ from: mul, to: gain.gain });
      outlet = gain;
    }
  }

  if (typeof add === "number") {
    offset += add;
  } else if (outlet) {
    gain = context.createGain();
    _.connect({ from: outlet, to: gain });
    _.connect({ from: add   , to: gain });
    outlet = gain;
  } else {
    outlet = add;
  }

  return { outlet: outlet, offset: offset };
}

module.exports = makeOutlet;

},{"./dc":4,"./utils":45}],20:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var NeuNode = require("./node");
var NeuDC   = require("./dc");
var NeuUnit = require("./unit");

var SelectorParser = require("./selector-parser");
var makeOutlet = require("./ugen-makeOutlet");

function NeuUGen(synth, key, spec, inputs) {
  NeuNode.call(this, synth);

  var parsed = SelectorParser.parse(key);

  if (!NeuUGen.registered.hasOwnProperty(parsed.key)) {
    throw new Error("unknown key: " + key);
  }

  this.$key   = parsed.key;
  this.$class = parsed.class;
  this.$id    = parsed.id;

  var unit = NeuUGen.registered[parsed.key](this, spec, inputs);

  if (!(unit instanceof NeuUnit)) {
    throw new Error("invalid key: " + key);
  }

  var outlet = makeOutlet(this.$context, unit, spec);

  this.$unit   = unit;
  this.$outlet = outlet.outlet;
  this.$offset = outlet.offset;

  Object.defineProperties(this, {
    context: {
      value: _.findAudioContext(this.$context),
      enumerable: true
    },
    outlet: {
      value: _.findAudioNode(this.$outlet),
      enumerable: true
    },
  });

  _.each(unit.$methods, function(method, name) {
    _.definePropertyIfNotExists(this, name, {
      value: method
    });
  }, this);
}
_.inherits(NeuUGen, NeuNode);

NeuUGen.$name = "NeuUGen";

NeuUGen.registered = {};

NeuUGen.register = function(name, func) {
  if (!SelectorParser.isValidUGenName(name)) {
    throw new Error("invalid ugen name: " + name);
  }
  if (typeof func !== "function") {
    throw new TypeError("ugen must be a function");
  }
  NeuUGen.registered[name] = func;
};

NeuUGen.build = function(synth, key, spec, inputs) {
  if (typeof key !== "string") {
    spec.value = key;
    key = _.typeOf(key);
  }

  return new NeuUGen(synth, key, spec, inputs);
};

NeuUGen.prototype._connect = function(to, output, input) {
  _.connect({
    from  : this.$outlet,
    to    : to,
    output: output,
    input : input
  });
  if (this.$offset !== 0) {
    if (to instanceof window.AudioParam) {
      to.value = this.$offset;
    } else {
      _.connect({
        from : createGainDC(this.$context, this.$offset),
        to   : to,
        input: input
      });
    }
  }
};

function createGainDC(context, offset) {
  var gain = context.createGain();

  gain.gain.value = offset;

  _.connect({ from: new NeuDC(context, 1), to: gain });

  return gain;
}

module.exports = _.NeuUGen = NeuUGen;

},{"./dc":4,"./node":11,"./selector-parser":13,"./ugen-makeOutlet":19,"./unit":44,"./utils":45}],21:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("+" ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +------------+
   * | GainNode   |
   * | - gain: 1  |
   * +------------+
   *   |
   */
  neume.register("+", function(ugen, spec, inputs) {
    var context = ugen.$context;
    var outlet  = null;

    var nodes  = [];
    var offset = 0;

    inputs.forEach(function(node) {
      if (typeof node === "number") {
        offset += node;
      } else {
        nodes.push(node);
      }
    });
    offset = _.finite(offset);

    if (nodes.length) {
      outlet = context.createGain();

      nodes.forEach(function(node) {
        _.connect({ from: node, to: outlet });
      });

      outlet.$maddOptimizable = true;
    }

    return new neume.Unit({
      outlet: outlet,
      offset: offset
    });
  });

};

},{}],22:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $([], {
   *   mode : enum[ clip, wrap, fold ] = wrap
   *   lag  : [number] = 0
   *   curve: [number] = 0
   * } ... inputs)
   *
   * methods:
   *   setValue(t, value)
   *   at(t, index)
   *   next(t)
   *   prev(t)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +----------------------+
   * | GainNode             |
   * | - gain: array[index] |
   * +----------------------+
   *   |
   */
  neume.register("array", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var gain  = context.createGain();
    var index = 0;
    var data  = spec.value;
    var mode  = {
      clip: _.clipAt,
      fold: _.foldAt,
    }[spec.mode] || /* istanbul ignore next*/ _.wrapAt;
    var lag   = _.finite(spec.lag);
    var curve = _.finite(spec.curve);

    if (!Array.isArray(data) || data.length === 0)  {
      data = [ 0 ];
    }

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    var prevValue = _.finite(data[0]);

    gain.gain.setValueAtTime(prevValue, 0);

    function update(t0, nextIndex) {
      var v0 = prevValue;
      var v1 = _.finite(mode(data, nextIndex));

      if (lag <= 0 || curve < 0 || 1 <= curve) {
        gain.gain.setValueAtTime(v1, t0);
      } else {
        gain.gain.setTargetAtTime(v1, t0, timeConstant(lag, v0, v1, curve));
      }

      prevValue = v1;
      index = nextIndex;
    }

    return new neume.Unit({
      outlet: gain,
      methods: {
        setValue: function(t, value) {
          if (Array.isArray(value)) {
            context.sched(t, function() {
              data = value;
            });
          }
        },
        at: function(t, index) {
          context.sched(t, function() {
            update(t, _.int(index));
          });
        },
        next: function(t) {
          context.sched(t, function() {
            update(t, index + 1);
          });
        },
        prev: function(t) {
          context.sched(t, function() {
            update(t, index - 1);
          });
        }
      }
    });
  });

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],23:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  [
    "AudioBufferSourceNode",
    "MediaElementAudioSourceNode",
    "MediaStreamAudioSourceNode",
    "ScriptProcessorNode",
    "GainNode",
    "BiquadFilterNode",
    "DelayNode",
    "PannerNode",
    "ConvolverNode",
    "AnalyserNode",
    "DynamicsCompressorNode",
    "WaveShaperNode",
    "OscillatorNode",
  ].forEach(function(name) {
    name = name.toLowerCase();

    neume.register(name, function(ugen, spec, inputs) {
      var node = spec.value;

      if (node && node.numberOfInputs === 0) {
        inputs = [];
      }

      return make(setup(node, inputs));
    });
  });

  function setup(audioNode, inputs) {
    inputs.forEach(function(node) {
      _.connect({ from: node, to: audioNode });
    });
    return audioNode;
  }

  function make(audioNode) {
    return new neume.Unit({
      outlet: audioNode
    });
  }

};

},{}],24:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("biquad", {
   *   type  : enum[ lowpass, highpass, lowshelf, highshelf, peaking, notch, allpass ] = lowpass
   *   freq  : [number|UGen] = 350
   *   detune: [number|UGen] = 0
   *   Q     : [number|UGen] = 1
   *   gain  : [number|UGen] = 0
   * } ... inputs)
   *
   * aliases:
   *   $("lowpass"), $("highpass"),
   *   $("lowshelf"), $("highshelf"), $("peaking"), $("notch"), $("allpass")
   *   $("lpf"), $("hpf"), $("bpf")
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +-------------------------+
   * | BiquadFilterNode        |
   * | - type: type            |
   * | - freqquency: freq(350) |
   * | - detune: detune(0)     |
   * | - Q: Q(1)               |
   * | - gain: gain(0)         |
   * +-------------------------+
   *  |
   */

  var FILTER_TYPES = {
    lowpass  : "lowpass",
    highpass : "highpass",
    lowshelf : "lowshelf",
    highshelf: "highshelf",
    peaking  : "peaking",
    notch    : "notch",
    allpass  : "allpass",
    lpf      : "lowpass",
    hpf      : "highpass",
    bpf      : "bandpass",
  };

  neume.register("biquad", function(ugen, spec, inputs) {
    var type = FILTER_TYPES[spec.type] || "lowpass";
    return make(setup(type, ugen, spec, inputs));
  });

  _.each(FILTER_TYPES, function(type, name) {
    neume.register(name, function(ugen, spec, inputs) {
      return make(setup(type, ugen, spec, inputs));
    });
  });

  function setup(type, ugen, spec, inputs) {
    var biquad = ugen.$context.createBiquadFilter();

    biquad.type = type;
    biquad.frequency.value = 0;
    biquad.detune.value    = 0;
    biquad.Q.value         = 0;
    biquad.gain.value      = 0;
    _.connect({ from: _.defaults(spec.freq  , 350), to: biquad.frequency });
    _.connect({ from: _.defaults(spec.detune,   0), to: biquad.detune    });
    _.connect({ from: _.defaults(spec.Q     ,   1), to: biquad.Q         });
    _.connect({ from: _.defaults(spec.gain  ,   0), to: biquad.gain      });

    _.each(inputs, function(node) {
      _.connect({ from: node, to: biquad });
    });

    return biquad;
  }

  function make(biquad) {
    return new neume.Unit({
      outlet: biquad
    });
  }

};

},{}],25:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $(boolean, {
   *   lag  : [number] = 0
   *   curve: [number] = 0
   * } ... inputs)
   *
   * methods:
   *   setValue(t, value)
   *   toggle(t)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +-----------------------+
   * | GainNode              |
   * | - gain: value ? 0 : 1 |
   * +-----------------------+
   *   |
   */
  neume.register("boolean", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var gain  = context.createGain();
    var data  = !!spec.value;
    var lag   = _.finite(spec.lag);
    var curve = _.finite(spec.curve);

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    gain.gain.setValueAtTime(data ? 1 : 0, 0);

    function update(t0, v0, v1, nextData) {
      if (lag <= 0 || curve < 0 || 1 <= curve) {
        gain.gain.setValueAtTime(v1, t0);
      } else {
        gain.gain.setTargetAtTime(v1, t0, timeConstant(lag, v0, v1, curve));
      }
      data = nextData;
    }

    return new neume.Unit({
      outlet: gain,
      methods: {
        setValue: function(t, value) {
          if (typeof value === "boolean") {
            context.sched(t, function() {
              var v0 = data  ? 1 : 0;
              var v1 = value ? 1 : 0;
              update(t, v0, v1, value);
            });
          }
        },
        toggle: function(t) {
          context.sched(t, function() {
            var v0 = data ? 1 : 0;
            var v1 = data ? 0 : 1;
            update(t, v0, v1, !data);
          });
        }
      }
    });
  });

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],26:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("buf", {
   *   buffer      : [AudioBuffer|NeuBuffer] = null
   *   playbackRate: [number|UGen] = 1
   *   loop        : [boolean] = false
   *   loopStart   : [number] = 0
   *   loopEnd     : [number] = 0
   * })
   *
   * aliases:
   *   $(AudioBuffer), $(NeuBuffer)
   *
   * start:
   *   start BufferSourceNode
   *
   * stop:
   *   stop BufferSourceNode
   *
   * +---------------------------+
   * | BufferSourceNode          |
   * | - buffer: buffer(null)    |
   * | - playbackRate: rate(1)   |
   * | - loop: loop(false)       |
   * | - loopStart: loopStart(0) |
   * | - loopEnd: loopEnd(0)     |
   * +---------------------------+
   *   |
   */
  neume.register("buf", function(ugen, spec) {
    return make(spec.buffer, ugen, spec);
  });

  neume.register("audiobuffer", function(ugen, spec) {
    return make(spec.value, ugen, spec);
  });

  neume.register("neubuffer", function(ugen, spec) {
    return make(spec.value, ugen, spec);
  });

  function make(buffer, ugen, spec) {
    buffer = _.findAudioBuffer(buffer);

    var context = ugen.$context;
    var bufSrc  = context.createBufferSource();

    /* istanbul ignore else */
    if (buffer != null) {
      bufSrc.buffer = buffer;
    }
    bufSrc.loop = !!_.defaults(spec.loop, false);
    bufSrc.loopStart = _.finite(_.defaults(spec.loopStart, 0));
    bufSrc.loopEnd   = _.finite(_.defaults(spec.loopEnd  , 0));

    bufSrc.playbackRate.value = 0;
    _.connect({ from: _.defaults(spec.rate, 1), to: bufSrc.playbackRate });

    var offset = _.finite(_.defaults(spec.offset, 0));
    var duration = _.defaults(spec.duration, null);
    if (duration != null) {
      duration = _.finite(duration);
    }

    function start(t) {
      if (duration != null) {
        bufSrc.start(t, offset, duration);
      } else {
        bufSrc.start(t, offset);
      }
      bufSrc.onended = function() {
        // TODO: test!!
        ugen.emit("end", {
          playbackTime: context.currentTime
        }, ugen.$synth);
      };
    }

    function stop(t) {
      bufSrc.stop(t);
    }

    return new neume.Unit({
      outlet: bufSrc,
      start : start,
      stop  : stop
    });
  }

};

},{}],27:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("comp", {
   *   threshold: [number|UGen] = -24
   *   knee     : [number|UGen] =  30
   *   ratio    : [number|UGen] =  12
   *   attack   : [number|UGen] =  0.003
   *   release  : [number|UGen] =  0.250
   * } ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +-----------------------------+
   * | DynamicsCompressorNode      |
   * | - threshold: threshold(-24) |
   * | - knee: knee(30)            |
   * | - ratio: ratio(12)          |
   * | - attack: attack(0.003)     |
   * | - release: release(0.25)    |
   * +-----------------------------+
   *   |
   */
  neume.register("comp", function(ugen, spec, inputs) {
    var comp = ugen.$context.createDynamicsCompressor();

    comp.threshold.value = 0;
    comp.knee.value = 0;
    comp.ratio.value = 0;
    comp.attack.value = 0;
    comp.release.value = 0;
    _.connect({ from: _.defaults(spec.threshold,   -24), to: comp.threshold });
    _.connect({ from: _.defaults(spec.knee     ,    30), to: comp.knee });
    _.connect({ from: _.defaults(spec.ratio    ,    12), to: comp.ratio });
    _.connect({ from: _.defaults(spec.attack   , 0.003), to: comp.attack });
    _.connect({ from: _.defaults(spec.release  , 0.250), to: comp.release });

    inputs.forEach(function(node) {
      _.connect({ from: node, to: comp });
    });

    return new neume.Unit({
      outlet: comp
    });
  });

};

},{}],28:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("conv", {
   *   buffer   : [AudioBuffer|NeuBuffer] = null
   *   normalize: [boolean]               = true
   *   mix      : [number|UGen]           = 1
   * } ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   |    |
   *   |  +------------------------------+
   *   |  | ConvolverNode                |
   *   |  | - buffer: buffer(null)       |
   *   |  | - normalize: normalize(true) |
   *   |  +------------------------------+
   *   |    |
   * +--------+
   * | DryWet |
   * +--------+
   *   |
   */
  neume.register("conv", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var buffer = _.findAudioBuffer(spec.buffer);
    var conv = context.createConvolver();

    var mix = _.defaults(spec.mix, 1);

    /* istanbul ignore else */
    if (buffer != null) {
      conv.buffer = buffer;
    }
    conv.normalize = !!_.defaults(spec.normalize, true);

    var outlet = new neume.DryWet(context, inputs, conv, mix);

    return new neume.Unit({
      outlet: outlet
    });
  });

};

},{}],29:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  var WEB_AUDIO_MAX_DELAY_TIME = 180;

  /**
   * $("delay", {
   *   delayTime   : [number|UGen] = 0
   *   maxDelayTime: [number]      = delayTime
   * } ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +------------------------+
   * | DelayNode              |
   * | - delayTime: delayTime |
   * +------------------------+
   *   |
   */
  neume.register("delay", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var delayTime = _.defaults(spec.delayTime, 0);
    var maxDelayTime;

    if (typeof delayTime === "number") {
      delayTime    = _.clip(_.finite(delayTime), 0, WEB_AUDIO_MAX_DELAY_TIME);
      maxDelayTime = delayTime;
    } else {
      maxDelayTime = _.finite(_.defaults(spec.maxDelayTime, 1));
    }
    maxDelayTime = _.clip(maxDelayTime, 1 / context.sampleRate, WEB_AUDIO_MAX_DELAY_TIME);

    var delay = context.createDelay(maxDelayTime);

    delay.delayTime.value = 0;
    _.connect({ from: delayTime, to: delay.delayTime });

    inputs.forEach(function(node) {
      _.connect({ from: node, to: delay });
    });

    return new neume.Unit({
      outlet: delay
    });
  });

};

},{}],30:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";


  /**
   * $("env", {
   *   init   : [number]    = 0
   *   table  : [env-table] = []
   *   release: [number]    = Infinity
   * })
   *
   * env-table:
   *   [ [ duration, target, curve ], ... ]
   *
   * aliases:
   *   $("adsr", {
   *     a    : [number] = 0.01   attackTime
   *     d    : [number] = 0.30   decayTime
   *     s    : [number] = 0.50   sustainLevel
   *     r    : [number] = 1.00   releaseTime
   *     curve: [number] = 0.01  curve
   *   })
   *
   *   $("dadsr", {
   *     delay : [number] = 0.10   delayTime
   *     a     : [number] = 0.01   attackTime
   *     d     : [number] = 0.30   decayTime
   *     s     : [number] = 0.50   sustainLevel
   *     r     : [number] = 1.00   releaseTime
   *     curve : [number] = 0.01  curve
   *   })
   *
   *   $("asr", {
   *     a    : [number] = 0.01   attackTime
   *     s    : [number] = 1.00   sustainLevel
   *     r    : [number] = 1.00   releaseTime
   *     curve: [number] = 0.01  curve
   *   })
   *
   *   $("cutoff", {
   *     releaseTime: [number] = 0.1    releaseTime
   *     level      : [number] = 1.00   peakLevel
   *     curve      : [number] = 0.01  curve
   *   })
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +---------------+
   * | GainNode      |
   * | - gain: value |
   * +---------------+
   *   |
   */
  neume.register("env", function(ugen, spec, inputs) {
    var init  = _.finite(_.defaults(spec.init, 0));
    var table = _.isArray(spec.table) ? spec.table : [];
    var releaseNode = _.num(_.defaults(spec.release, Infinity));

    return make(init, table, releaseNode, ugen, spec, inputs);
  });

  neume.register("adsr", function(ugen, spec, inputs) {
    var a = _.finite(_.defaults(spec.a, 0.01));
    var d = _.finite(_.defaults(spec.d, 0.30));
    var s = _.finite(_.defaults(spec.s, 0.50));
    var r = _.finite(_.defaults(spec.r, 1.00));
    var curve = _.finite(_.defaults(spec.curve, 0.01));

    var init = 0;
    var table = [
      [ a, 1, curve ], // a
      [ d, s, curve ], // d
      [ r, 0, curve ], // r
    ];
    var releaseNode = 2;

    return make(init, table, releaseNode, ugen, spec, inputs);
  });

  neume.register("dadsr", function(ugen, spec, inputs) {
    var delay = _.finite(_.defaults(spec.delay, 0.1));
    var a = _.finite(_.defaults(spec.a, 0.01));
    var d = _.finite(_.defaults(spec.d, 0.30));
    var s = _.finite(_.defaults(spec.s, 0.50));
    var r = _.finite(_.defaults(spec.r, 1.00));
    var curve = _.finite(_.defaults(spec.curve, 0.01));

    var init = 0;
    var table = [
      [ delay, 0, curve ], // d
      [ a    , 1, curve ], // a
      [ d    , s, curve ], // d
      [ r    , 0, curve ], // r
    ];
    var releaseNode = 3;

    return make(init, table, releaseNode, ugen, spec, inputs);
  });

  neume.register("asr", function(ugen, spec, inputs) {
    var a = _.finite(_.defaults(spec.a, 0.01));
    var s = _.finite(_.defaults(spec.s, 1.00));
    var r = _.finite(_.defaults(spec.r, 1.00));
    var curve = _.finite(_.defaults(spec.curve, 0.01));

    var init = 0;
    var table = [
      [ a, s, curve ], // a
      [ r, 0, curve ], // r
    ];
    var releaseNode = 1;

    return make(init, table, releaseNode, ugen, spec, inputs);
  });

  neume.register("cutoff", function(ugen, spec, inputs) {
    var releaseTime = _.finite(_.defaults(spec.releaseTime, 0.1));
    var level = _.finite(_.defaults(spec.level, 1.00));
    var curve = _.finite(_.defaults(spec.curve, 0.01));

    var init = level;
    var table = [
      [ releaseTime, 0, curve ], // r
    ];
    var releaseNode = 0;

    return make(init, table, releaseNode, ugen, spec, inputs);
  });

  function make(init, table, releaseNode, ugen, spec, inputs) {
    var context = ugen.$context;

    var env  = context.createGain();
    var gain = env.gain;
    var startTable = table.slice(0, releaseNode);
    var stopTable  = table.slice(releaseNode);

    var releaseValue = startTable.length ? _.finite(_.last(startTable)[1]) : init;
    var schedId = 0;

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: env });
    });

    gain.value = init;

    function start(t) {
      var v0 = init;
      var t0 = t;

      gain.setValueAtTime(v0, t0);
      schedule(gain, startTable, v0, t0);
    }

    function stop() {
      context.unsched(schedId);
      schedId = 0;
    }

    function release(t) {
      var v0 = releaseValue;
      var t0 = t;
      var t1 = schedule(gain, stopTable, v0, t0);

      schedId = context.sched(t1, function(t) {
        schedId = 0;
        ugen.emit("end", { playbackTime: t }, ugen.$synth);
      });
    }

    return new neume.Unit({
      outlet: env,
      start : start,
      stop  : stop,
      methods: {
        release: release
      }
    });
  }

  function schedule(gain, table, v0, t0) {
    table.forEach(function(params) {
      var dur = _.finite(params[0]);
      var t1  = t0 + dur;
      var v1  = _.finite(params[1]);
      var cur = _.finite(params[2]);

      if (v0 === v1 || dur <= 0) {
        gain.setValueAtTime(v1, t0);
      } else if (0 < cur && cur < 1) {
        gain.setTargetAtTime(v1, t0, timeConstant(dur, v0, v1, cur));
      }

      t0 = t1;
      v0 = v1;
    });

    return t0;
  }

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],31:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /* istanbul ignore next */
  var NOP = function() {};

  /**
   * $(function, {
   *   lag  : [number] = 0
   *   curve: [number] = 0
   * } ... inputs)
   *
   * methods:
   *   setValue(t, value)
   *   execute(t)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +-------------------------+
   * | GainNode                |
   * | - gain: evaluated value |
   * +-------------------------+
   *   |
   */
  neume.register("function", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var gain  = context.createGain();
    var data  = typeof spec.value === "function" ? spec.value : /* istanbul ignore next */ NOP;
    var lag   = _.finite(spec.lag);
    var curve = _.finite(spec.curve);
    var count = 0;

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    var prevValue = _.finite(data(0, count++));

    gain.gain.setValueAtTime(prevValue, 0);

    function update(t0) {
      var v0 = prevValue;
      var v1 = _.finite(data(t0, count++));

      if (lag <= 0 || curve < 0 || 1 <= curve) {
        gain.gain.setValueAtTime(v1, t0);
      } else {
        gain.gain.setTargetAtTime(v1, t0, timeConstant(lag, v0, v1, curve));
      }

      prevValue = v1;
    }

    return new neume.Unit({
      outlet: gain,
      methods: {
        setValue: function(t, value) {
          if (typeof value === "function") {
            context.sched(t, function() {
              data = value;
            });
          }
        },
        evaluate: function(t) {
          context.sched(t, function() {
            update(t);
          });
        }
      }
    });
  });

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],32:[function(require,module,exports){
module.exports = function(neume) {
  "use strict";

  neume.use(require("./add"));
  neume.use(require("./array"));
  neume.use(require("./audio-node"));
  neume.use(require("./biquad"));
  neume.use(require("./boolean"));
  neume.use(require("./buf"));
  neume.use(require("./comp"));
  neume.use(require("./conv"));
  neume.use(require("./delay"));
  neume.use(require("./env"));
  neume.use(require("./function"));
  neume.use(require("./iter"));
  neume.use(require("./line"));
  neume.use(require("./media-stream"));
  neume.use(require("./media"));
  neume.use(require("./mul"));
  neume.use(require("./noise"));
  neume.use(require("./number"));
  neume.use(require("./osc"));
  neume.use(require("./pan"));
  neume.use(require("./script"));
  neume.use(require("./shaper"));

};

},{"./add":21,"./array":22,"./audio-node":23,"./biquad":24,"./boolean":25,"./buf":26,"./comp":27,"./conv":28,"./delay":29,"./env":30,"./function":31,"./iter":33,"./line":34,"./media":36,"./media-stream":35,"./mul":37,"./noise":38,"./number":39,"./osc":40,"./pan":41,"./script":42,"./shaper":43}],33:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  var ITERATE  = 0;
  var FINISHED = 1;

  /**
   * $("iter", {
   *   iter : [iterator] = null
   *   lag  : [number] = 0
   *   curve: [number] = 0
   * } ... inputs)
   *
   * methods:
   *   next(t)
   *   reset(t)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +----------------------+
   * | GainNode             |
   * | - gain: array[index] |
   * +----------------------+
   *   |
   */
  neume.register("iter", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var gain  = context.createGain();
    var iter  = _.defaults(spec.iter, {});
    var lag   = _.finite(spec.lag);
    var curve = _.finite(spec.curve);
    var state = ITERATE;

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    var prevValue = 0;

    gain.gain.setValueAtTime(prevValue, 0);

    function iterNext() {
      return typeof iter.next === "function" ? iter.next() : 0;
    }

    function update(t, v1) {
      v1 = _.finite(v1);

      if (lag <= 0 || curve < 0 || 1 <= curve) {
        gain.gain.setValueAtTime(v1, t);
      } else {
        gain.gain.setTargetAtTime(v1, t, timeConstant(lag, prevValue, v1, curve));
      }

      prevValue = v1;
    }

    function next(t) {
      if (state !== ITERATE) {
        return;
      }

      var v1 = iterNext();

      if (v1 == null) {
        state = FINISHED;
        ugen.emit("end", { playbackTime: t }, ugen.$synth);
      } else {
        update(t, v1);
      }
    }

    function reset(t) {
      if (typeof iter.reset === "function") {
        iter.reset();
      }
      update(t, iterNext());
    }

    return new neume.Unit({
      outlet: gain,
      start: function(t) {
        prevValue = _.finite(iterNext());
        gain.gain.setValueAtTime(prevValue, t);
      },
      methods: {
        setValue: function(t, value) {
          context.sched(t, function() {
            iter = _.defaults(value, {});
          });
        },
        next: function(t) {
          context.sched(t, function() {
            next(t);
          });
        },
        reset: function(t) {
          context.sched(t, function() {
            reset(t);
          });
        },
      }
    });
  });

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],34:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /*
   * $("line", {
   *   start: [number] = 1
   *   end  : [number] = 0
   *   dur  : [number] = 1
   * } ... inputs)
   *
   * $("xline", {
   *   start: [number] = 1
   *   end  : [number] = 0
   *   dur  : [number] = 1
   * } ... inputs)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +---------------+
   * | GainNode      |
   * | - gain: value |
   * +---------------+
   *   |
   */
  neume.register("line", function(ugen, spec, inputs) {
    var startValue = _.finite(_.defaults(spec.start, 1));
    var endValue   = _.finite(_.defaults(spec.end  , 0));
    var duration   = _.finite(_.defaults(spec.dur  , 1));
    return make("linearRampToValueAtTime", ugen, startValue, endValue, duration, inputs);
  });

  neume.register("xline", function(ugen, spec, inputs) {
    var startValue = Math.max(1e-6, _.finite(_.defaults(spec.start, 1)));
    var endValue   = Math.max(1e-6, _.finite(_.defaults(spec.end  , 0)));
    var duration   = _.finite(_.defaults(spec.dur  , 1));
    return make("exponentialRampToValueAtTime", ugen, startValue, endValue, duration, inputs);
  });

  function make(curve, ugen, startValue, endValue, duration, inputs) {
    var context = ugen.$context;

    var line  = context.createGain();
    var gain  = line.gain;
    var schedId = 0;

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(input) {
      _.connect({ from: input, to: line });
    });

    gain.setValueAtTime(startValue, 0);

    function start(t) {
      var t0 = t;
      var t1 = t0 + duration;

      gain.setValueAtTime(startValue, t0);
      gain[curve](endValue, t1);

      schedId = context.sched(t1, function(t) {
        schedId = 0;
        ugen.emit("end", { playbackTime: t }, ugen.$synth);
      });
    }

    function stop() {
      context.unsched(schedId);
    }

    return new neume.Unit({
      outlet: line,
      start : start,
      stop  : stop
    });
  }

};

},{}],35:[function(require,module,exports){
module.exports = function(neume) {
  "use strict";

  /**
   * $("media-stream", {
   *   stream: [MediaStream] = null
   * })
   */
  neume.register("media-stream", function(ugen, spec) {
    return make(setup(ugen, spec.stream));
  });

  function setup(ugen, stream) {
    if (window.MediaStream && stream instanceof window.MediaStream) {
      return ugen.$context.createMediaStreamSource(stream);
    }
    return null;
  }

  function make(outlet) {
    return new neume.Unit({
      outlet: outlet
    });
  }
};

},{}],36:[function(require,module,exports){
module.exports = function(neume) {
  "use strict";

  /**
   * $("media", {
   *   media: [HTMLMediaElement] = null
   * })
   *
   * $(HTMLAudioElement)
   *
   * $(HTMLVideoElement)
   *
   */
  neume.register("media", function(ugen, spec) {
    return make(setup(ugen, spec.media));
  });

  neume.register("htmlaudioelement", function(ugen, spec) {
    return make(setup(ugen, spec.value));
  });

  neume.register("htmlvideoelement", function(ugen, spec) {
    return make(setup(ugen, spec.value));
  });

  function setup(ugen, media) {
    if (window.HTMLMediaElement && media instanceof window.HTMLMediaElement) {
      return ugen.$context.createMediaElementSource(media);
    }
    return null;
  }

  function make(outlet) {
    return new neume.Unit({
      outlet: outlet
    });
  }
};

},{}],37:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /*
   * +-----------+
   * | inputs[0] |
   * +-----------+
   *   |
   * +-----------+
   * | GainNode  |  +-----------+
   * | - gain: 0 |--| inputs[1] |
   * +-----------+  +-----------+
   *   |
   * +-----------+
   * | GainNode  |  +-----------+
   * | - gain: 0 |--| inputs[2] |
   * +-----------+  +-----------+
   *   |
   * +------------------+
   * | GainNode         |
   * | - gain: multiple |
   * +------------------+
   *   |
   */
  neume.register("*", function(ugen, spec, inputs) {
    var context = ugen.$context;
    var outlet  = null;

    var nodes    = [];
    var multiple = 1;

    inputs.forEach(function(node) {
      if (typeof node === "number") {
        multiple *= node;
      } else {
        nodes.push(node);
      }
    });
    multiple = _.finite(multiple);

    if (nodes.length && multiple !== 0) {
      outlet = nodes.shift();

      outlet = nodes.reduce(function(outlet, node) {
        var gain = context.createGain();

        gain.gain.value = 0;

        _.connect({ from: node  , to: gain.gain });
        _.connect({ from: outlet, to: gain });

        return gain;
      }, outlet);

      if (multiple !== 1) {
        var tmp = outlet;

        outlet = context.createGain();

        outlet.gain.value = multiple;
        _.connect({ from: tmp, to: outlet });
      }
    }

    return new neume.Unit({
      outlet: outlet,
      offset: 0
    });

  });

};

},{}],38:[function(require,module,exports){
module.exports = function(neume) {
  "use strict";

  /**
   * $("white")
   *
   * $("pink")
   *
   * +------------------+
   * | BufferSourceNode |
   * | - loop: true     |
   * +------------------+
   *   |
   */
  neume.register("white", function(ugen) {
    whiteNoise = whiteNoise || generateWhiteNoise(ugen.$context.sampleRate);
    return make(whiteNoise, ugen);
  });

  neume.register("pink", function(ugen) {
    pinkNoise = pinkNoise || generatePinkNoise(ugen.$context.sampleRate);
    return make(pinkNoise, ugen);
  });

  function make(data, ugen) {
    var buf = ugen.$context.createBuffer(1, data.length, ugen.$context.sampleRate);
    var bufSrc = ugen.$context.createBufferSource();

    buf.getChannelData(0).set(data);

    bufSrc.buffer = buf;
    bufSrc.loop   = true;

    return new neume.Unit({
      outlet: bufSrc,
      start: function(t) {
        bufSrc.start(t);
      },
      stop: function(t) {
        bufSrc.stop(t);
      }
    });
  }

  var whiteNoise = null;
  var pinkNoise  = null;

  function generateWhiteNoise(sampleRate) {
    var noise = new Float32Array(sampleRate);

    for (var i = 0, imax = noise.length; i < imax; i++) {
      noise[i] = Math.random() * 2.0 - 1.0;
    }

    return noise;
  }

  function generatePinkNoise(sampleRate) {
    var noise = new Float32Array(sampleRate);

    var whites = new Uint8Array([ rand(), rand(), rand(), rand(), rand() ]);

    var MAX_KEY = 31;
    var key = 0;
    var last_key, diff;

    for (var i = 0, imax = noise.length; i < imax; i++) {
      last_key = key++;
      key &= MAX_KEY;

      diff = last_key ^ key;

      var sum = 0;
      for (var j = 0; j < 5; ++j) {
        if (diff & (1 << j)) {
          whites[j] = rand();
        }
        sum += whites[j];
      }

      noise[i] = (sum * 0.01666666) - 1;
    }

    return noise;
  }

  function rand() {
    return ((Math.random() * 1073741824)|0) % 25;
  }

};

},{}],39:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $(number, {
   *   lag  : number = 0
   *   curve: number = 0
   * } ... inputs)
   *
   * methods:
   *   setValue(t, value)
   *
   * +--------+      +-------+
   * | inputs |  or  | DC(1) |
   * +--------+      +-------+
   *   ||||||
   * +---------------+
   * | GainNode      |
   * | - gain: value |
   * +---------------+
   *   |
   */
  neume.register("number", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var gain  = context.createGain();
    var data  = _.finite(spec.value);
    var lag   = _.finite(spec.lag);
    var curve = _.finite(spec.curve);

    if (inputs.length === 0) {
      inputs = [ new neume.DC(context, 1) ];
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    gain.gain.setValueAtTime(data, 0);

    function update(t0, v0, v1, nextData) {
      if (lag <= 0 || curve < 0 || 1 <= curve) {
        gain.gain.setValueAtTime(v1, t0);
      } else {
        gain.gain.setTargetAtTime(v1, t0, timeConstant(lag, v0, v1, curve));
      }
      data = nextData;
    }

    return new neume.Unit({
      outlet: gain,
      methods: {
        setValue: function(t, value) {
          if (_.isFinite(value)) {
            context.sched(t, function() {
              update(t, data, value, value);
            });
          }
        }
      }
    });
  });

  function timeConstant(duration, startValue, endValue, curve) {
    var targetValue = startValue + (endValue - startValue) * (1 - curve);

    return -duration / Math.log((targetValue - endValue) / (startValue - endValue));
  }

};

},{}],40:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("osc", {
   *   type  : [string|PeriodicWave]="sin",
   *   freq  : [number|UGen]=440,
   *   detune: [number|UGen]=0
   * } ... inputs)
   *
   * aliases:
   *   $("sin"), $("square"), $("saw"), $("tri"), $(PeriodicWave)
   *
   * start:
   *   start OscillatorNode
   *
   * stop:
   *   stop OscillatorNode
   *
   *
   * no inputs
   * +------------------------+
   * | OscillatorNode         |
   * | - type: type           |
   * | - frequency: freq(440) |
   * | - detune: detune(0)    |
   * +------------------------+
   *   |
   *
   * has inputs
   * +--------+
   * | inputs |
   * +--------+     +----------------------+
   *   ||||||       | OscillatorNode       |
   * +-----------+  | - type: type         |
   * | GainNode  |  | - frequency: freq(2) |
   * | - gain: 0 |--| - detune: detune(0)  |
   * +-----------+  +----------------------+
   *   |
   */

  var WAVE_TYPES = {
    sin   : "sine",
    square: "square",
    saw   : "sawtooth",
    tri   : "triangle"
  };

  neume.register("osc", function(ugen, spec, inputs) {
    var type = spec.type;

    if (!isWave(type)) {
      type = WAVE_TYPES[type] || "sine";
    }

    return make(setup(type, ugen, spec, inputs));

  });

  function periodicwave(ugen, spec, inputs) {
    var type = spec.value;

    if (!isWave(type)) {
      type = "sine";
    }

    return make(setup(type, ugen, spec, inputs));

  }

  neume.register("periodicwave", periodicwave);
  neume.register("wavetable"   , periodicwave);

  _.each(WAVE_TYPES, function(type, name) {
    neume.register(name, function(ugen, spec, inputs) {
      return make(setup(type, ugen, spec, inputs));
    });
  });

  function isWave(wave) {
    if (window.PeriodicWave && wave instanceof window.PeriodicWave) {
      return true;
    }
    if (window.WaveTable && wave instanceof window.WaveTable) {
      return true;
    }
    return false;
  }

  function setWave(osc, wave) {
    if (osc.setPeriodicWave) {
      return osc.setPeriodicWave(wave);
    }
    if (osc.setWaveTable) {
      return osc.setWaveTable(wave);
    }
  }

  function setup(type, ugen, spec, inputs) {
    return inputs.length ?
      hasInputs(type, ugen, spec, inputs) : noInputs(type, ugen, spec);
  }

  function make(osc) {
    var ctrl = osc.ctrl;

    return new neume.Unit({
      outlet: osc.outlet,
      start: function(t) {
        ctrl.start(t);
      },
      stop: function(t) {
        ctrl.stop(t);
      }
    });
  }

  function createOscillator(context, type, spec, defaultFreq) {
    var osc = context.createOscillator();

    if (isWave(type)) {
      setWave(osc, type);
    } else {
      osc.type = type;
    }
    osc.frequency.value = 0;
    osc.detune.value    = 0;
    _.connect({ from: _.defaults(spec.freq, defaultFreq), to: osc.frequency });
    _.connect({ from: _.defaults(spec.detune, 0), to: osc.detune });

    return osc;
  }

  function noInputs(type, ugen, spec) {
    var osc = createOscillator(ugen.$context, type, spec, 440);
    return { outlet: osc, ctrl: osc };
  }

  function hasInputs(type, ugen, spec, inputs) {
    var context = ugen.$context;

    var osc  = createOscillator(context, type, spec , 2);
    var gain = ugen.$context.createGain();

    gain.gain.value = 0;
    _.connect({ from: osc, to: gain.gain });

    inputs.forEach(function(node) {
      _.connect({ from: node, to: gain });
    });

    return { outlet: gain, ctrl: osc };
  }

};

},{}],41:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("pan", {
   * } ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +------------+
   * | PannerNode |
   * +------------+
   *   |
   */
  var PannerNodeParams = {
    refDistance   : true,
    maxDistance   : true,
    rolloffFactor : true,
    coneInnerAngle: true,
    coneOuterAngle: true,
    coneOuterGain : true
  };

  neume.register("pan", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var pan = context.createPanner();

    pan.panningModel = {
      equalpower: "equalpower",
      eq        : "equalpower"
    }[spec.panningModel] || "HRTF";

    pan.distanceModel = {
      linear     : "linear",
      exponential: "exponential",
      lin: "linear",
      exp: "exponential",
    }[spec.distanceModel] || "inverse";

    pan.refDistance    = _.finite(_.defaults(spec.refDistance   , 1));
    pan.maxDistance    = _.finite(_.defaults(spec.maxDistance   , 10000));
    pan.rolloffFactor  = _.finite(_.defaults(spec.rolloffFactor , 1));
    pan.coneInnerAngle = _.finite(_.defaults(spec.coneInnerAngle, 360));
    pan.coneOuterAngle = _.finite(_.defaults(spec.coneOuterAngle, 360));
    pan.coneOuterGain  = _.finite(_.defaults(spec.coneOuterGain , 0));

    inputs.forEach(function(node) {
      _.connect({ from: node, to: pan });
    });

    function update(value) {
      _.each(value, function(value, key) {
        if (PannerNodeParams.hasOwnProperty(key)) {
          pan[key] = _.finite(value);
        }
      });
    }

    return new neume.Unit({
      outlet: pan,
      methods: {
        setValue: function(t, value) {
          if (_.isDictionary(value)) {
            context.sched(t, function() {
              update(value);
            });
          }
        },
        setPosition: function(t, x, y, z) {
          context.sched(t, function() {
            pan.setPosition(x, y, z);
          });
        },
        setOrientation: function(t, x, y, z) {
          context.sched(t, function() {
            pan.setOrientation(x, y, z);
          });
        },
        setVelocity: function(t, x, y, z) {
          context.sched(t, function() {
            pan.setVelocity(x, y, z);
          });
        },
      }
    });
  });

};

},{}],42:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  /**
   * $("script", {
   *   audioprocess: [function] = null
   * } ... inputs)
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +---------------------+
   * | ScriptProcessorNode |
   * +---------------------+
   *   |
   */
  neume.register("script", function(ugen, spec, inputs) {
    var context = ugen.$context;

    var outlet = context.createScriptProcessor(512, 1, 1);

    if (typeof spec.audioprocess === "function")  {
      outlet.onaudioprocess = spec.audioprocess;
    }

    inputs.forEach(function(node) {
      _.connect({ from: node, to: outlet });
    });

    return new neume.Unit({
      outlet: outlet
    });
  });

};

},{}],43:[function(require,module,exports){
module.exports = function(neume, _) {
  "use strict";

  var WS_CURVE_SIZE = 4096;

  /**
   * $("shaper", {
   *   curve: [Float32Array|number] = 0
   * } ... inputs)
   *
   * aliases:
   *   $("clip")
   *
   * +--------+
   * | inputs |
   * +--------+
   *   ||||||
   * +--------------------------+
   * | WaveShaperNode           |
   * | - curve: curve           |
   * | - oversample: oversample |
   * +--------------------------+
   *   |
   */
  neume.register("shaper", function(ugen, spec, inputs) {
    var curve = null;
    if (typeof spec.curve === "number") {
      curve = createCurve(_.finite(spec.curve));
    } else {
      curve = spec.curve;
    }
    return make(setup(curve, ugen, spec, inputs));
  });

  neume.register("clip", function(ugen, spec, inputs) {
    var curve = createCurve(0);
    return make(setup(curve, ugen, spec, inputs));
  });

  function setup(curve, ugen, spec, inputs) {
    var shaper = ugen.$context.createWaveShaper();

    if (curve instanceof Float32Array) {
      shaper.curve = curve;
    }
    shaper.oversample = { "2x":"2x", "4x":"4x" }[spec.oversample] || "none";

    inputs.forEach(function(node) {
      _.connect({ from: node, to: shaper });
    });

    return shaper;
  }

  function make(outlet) {
    return new neume.Unit({
      outlet: outlet
    });
  }

  var curves = {};

  function createCurve(amount) {
    amount = _.clip(amount, 0, 1);

    if (!curves[amount]) {
      curves[amount] = (amount === 1) ? createSquare() : createWSCurve(amount);
    }

    return curves[amount];
  }

  // http://stackoverflow.com/questions/7840347/web-audio-api-waveshapernode
  function createWSCurve(amount) {
    var curve = new Float32Array(WS_CURVE_SIZE);

    var k = 2 * amount / (1 - amount);

    for (var i = 0; i < WS_CURVE_SIZE; i++) {
      var x = i * 2 / WS_CURVE_SIZE - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }

    return curve;
  }

  function createSquare() {
    var curve = new Float32Array(WS_CURVE_SIZE);
    var half  = WS_CURVE_SIZE >> 1;

    for (var i = 0; i < WS_CURVE_SIZE; i++) {
      curve[i] = i < half ? -1 : +1;
    }

    return curve;
  }
};

},{}],44:[function(require,module,exports){
"use strict";

var _ = require("./utils");

var INIT  = 0;
var START = 1;
var STOP  = 2;

function NeuUnit(spec) {
  this._spec   = spec;
  this._state  = INIT;
  this.$outlet  = _.defaults(spec.outlet, null);
  this.$offset  = _.finite(spec.offset);
  this.$methods = _.defaults(spec.methods, {});
}
NeuUnit.$name = "NeuUnit";

NeuUnit.prototype.start = function(t) {
  if (this._state === INIT && _.isFunction(this._spec.start)) {
    this._state = START;
    this._spec.start(_.finite(t));
  }
};

NeuUnit.prototype.stop = function(t) {
  if (this._state === START && _.isFunction(this._spec.stop)) {
    this._state = STOP;
    this._spec.stop(_.finite(t));
  }
};

NeuUnit.prototype.apply = function(method, args) {
  if (this.$methods[method]) {
    this.$methods[method].apply(null, args);
  }
};

module.exports = NeuUnit;

},{"./utils":45}],45:[function(require,module,exports){
"use strict";

var utils = {};

utils.isArray = function(value) {
  return Array.isArray(value);
};

utils.isBoolean = function(value) {
  return typeof value === "boolean";
};

utils.isDictionary = function(value) {
  return value != null && value.constructor === Object;
};

utils.isFunction = function(value) {
  return typeof value === "function";
};

utils.isFinite = function(value) {
  return typeof value === "number" && isFinite(value);
};

utils.isNaN = function(value) {
  return value !== value;
};

utils.isNull = function(value) {
  return value === null;
};

utils.isNumber = function(value) {
  return typeof value === "number" && !isNaN(value);
};

utils.isObject = function(value) {
  var type = typeof value;
  return type === "function" || type === "object" && value !== null;
};

utils.isString = function(value) {
  return typeof value === "string";
};

utils.isTypedArray = function(value) {
  return value instanceof Float32Array ||
    value instanceof Uint8Array ||
    value instanceof Int8Array ||
    value instanceof Uint16Array ||
    value instanceof Int16Array ||
    value instanceof Uint32Array ||
    value instanceof Int32Array ||
    value instanceof Float64Array ||
    value instanceof Uint8ClampedArray;
};

utils.isUndefined = function(value) {
  return value === void 0;
};

utils.toArray = function(value) {
  if (value == null) {
    return [];
  }
  return Array.prototype.slice.call(value);
};

utils.fill = function(list, value) {
  for (var i = 0, imax = list.length; i < imax; i++) {
    list[i] = value;
  }
  return list;
};

utils.isEmpty = function(list) {
  return list.length === 0;
};

utils.first = function(list) {
  return list[0];
};

utils.second = function(list) {
  return list[1];
};

utils.last = function(list) {
  return list[list.length - 1];
};

utils.clipAt = function(list, index) {
  return list[Math.max(0, Math.min(index|0, list.length - 1))];
};

utils.wrapAt = function(list, index) {
  index = index|0;

  index %= list.length;
  if (index < 0) {
    index += list.length;
  }

  return list[index];
};

utils.foldAt = function(list, index) {
  index = index|0;

  var len2 = list.length * 2 - 2;

  index = index % len2;

  if (index < 0) {
    index += len2;
  }

  if (list.length <= index) {
    index = len2 - index;
  }

  return list[index];
};

utils.rest = function(list) {
  return list.slice(1);
};

utils.each = function(list, func, ctx) {
  var i, len, keys;

  if (list != null) {
    func = func.bind(ctx);
    len  = list.length;
    if (len === +len) {
      for (i = 0; i < len; ++i) {
        func(list[i], i, list);
      }
    } else {
      keys = Object.keys(list);
      len  = keys.length;
      for (i = 0; i < len; ++i) {
        func(list[keys[i]], keys[i], list);
      }
    }
  }

  return list;
};

utils.collect = function(list, func, ctx) {
  var result = [];

  func = func.bind(ctx);

  utils.each(list, function(elem, index) {
    result.push(func(elem, index, list));
  });

  return result;
};

utils.select = function(list, pred, ctx) {
  var result = [];

  pred = pred.bind(ctx);

  utils.each(list, function(elem, index) {
    if (pred(elem, index, list)) {
      result.push(elem);
    }
  });

  return result;
};

utils.reject = function(list, pred, ctx) {
  var result = [];

  pred = pred.bind(ctx);

  utils.each(list, function(elem, index) {
    if (!pred(elem, index, list)) {
      result.push(elem);
    }
  });

  return result;
};

utils.partition = function(list, pred, ctx) {
  var selected = [];
  var rejected = [];

  pred = pred.bind(ctx);

  utils.each(list, function(elem, index) {
    (pred(elem, index, list) ? selected : rejected).push(elem);
  });

  return [ selected, rejected ];
};

utils.reduce = function(list, func, init, ctx) {
  var result = init;

  func = func.bind(ctx);

  utils.each(list, function(elem, index) {
    result = func(result, elem, index, list);
  });

  return result;
};

utils.has = function(obj, key) {
  return obj != null && obj.hasOwnProperty(key);
};

utils.keys = function(obj) {
  return Object.keys(obj);
};

utils.values = function(obj) {
  return Object.keys(obj).map(function(key) {
    return obj[key];
  });
};

utils.pairs = function(obj) {
  return Object.keys(obj).map(function(key) {
    return [ key, obj[key] ];
  });
};

utils.definePropertyIfNotExists = function(obj, prop, descriptor) {
  if (!obj.hasOwnProperty(prop)) {
    Object.defineProperty(obj, prop, descriptor);
  }
  return obj;
};

utils.format = function(fmt, dict) {
  utils.each(dict, function(val, key) {
    if (/^\w+$/.test(key)) {
      fmt = fmt.replace(new RegExp("#\\{" + key + "\\}", "g"), val);
    }
  });
  return fmt;
};

utils.num = function(value) {
  return +value||0;
};

utils.int = function(value) {
  return +value|0;
};

utils.finite = function(value) {
  value = +value||0;
  if (!utils.isFinite(value)) {
    value = 0;
  }
  return value;
};

utils.clip = function(value, min, max) {
  return Math.max(min, Math.min(value, max));
};

utils.typeOf = function(value) {
  if (utils.isNumber(value)) {
    return "number";
  }
  if (utils.isArray(value)) {
    return "array";
  }
  if (utils.isString(value)) {
    return "string";
  }
  if (utils.isFunction(value)) {
    return "function";
  }
  if (utils.isBoolean(value)) {
    return "boolean";
  }
  if (utils.isNull(value)) {
    return "null";
  }
  if (utils.isUndefined(value)) {
    return "undefined";
  }
  if (utils.isNaN(value)) {
    return "nan";
  }
  if (value.constructor) {
    if (typeof value.constructor.$name === "string") {
      return value.constructor.$name.toLowerCase();
    }
    if (typeof value.constructor.name === "string") {
      return value.constructor.name.toLowerCase();
    }
  }
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

utils.defaults = function(value, defaultValue) {
  return value == null ? defaultValue : value;
};

utils.inherits = function(ctor, superCtor) {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, enumerable: false, writable: true, configurable: true }
  });
};

utils.isAudioContext = function(value) {
  return value instanceof window.AudioContext;
};

utils.isAudioNode = function(value) {
  return value instanceof window.AudioNode;
};

utils.isAudioParam = function(value) {
  return value instanceof window.AudioParam;
};

utils.findAudioContext = function(obj) {
  while (!(obj == null || utils.isAudioContext(obj))) {
    obj = obj.$context;
  }
  return obj || null;
};

utils.findAudioNode = function(obj) {
  while (!(obj == null || utils.isAudioNode(obj))) {
    obj = obj.$outlet;
  }
  return obj || null;
};

utils.findAudioBuffer = function(obj) {
  while (!(obj == null || obj instanceof window.AudioBuffer)) {
    obj = obj.$buffer;
  }
  return obj || null;
};

utils.isValidInput = function(value) {
  return utils.isFinite(value) || utils.isAudioNode(utils.findAudioNode(value));
};

utils.connect = function(spec) {
  var from = spec.from;
  var to   = spec.to;
  var output = utils.int(spec.output);
  var input  = utils.int(spec.input);

  if (from && from._connect) {
    return from._connect(to, output, input);
  }

  if (utils.isAudioParam(to)) {
    if (utils.isNumber(from)) {
      to.value = utils.finite(from);
    }
  }

  if (utils.isAudioNode(to)) {
    from = utils.findAudioNode(from);
    if (from) {
      return from.connect(to, output, input);
    }
  } else if (utils.isAudioParam(to)) {
    from = utils.findAudioNode(from);
    if (from) {
      return from.connect(to, output);
    }
  }
};

utils.disconnect = function(spec) {
  var from = utils.findAudioNode(spec.from);

  /* istanbul ignore else */
  if (from) {
    from.disconnect();
  }
};

module.exports = utils;

},{}]},{},[1])