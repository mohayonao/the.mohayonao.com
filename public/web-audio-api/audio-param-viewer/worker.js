var param = null;

function AudioParam() {
  this.duration = 0;
  this.minValue = 0;
  this.maxValue = 1;
}

AudioParam.prototype.setValueAtTime = function(value, startTime) {
  this.minValue = Math.min(this.minValue, value);
  this.maxValue = Math.max(this.maxValue, value);
  this.duration = Math.max(this.duration, startTime);
};

AudioParam.prototype.linearRampToValueAtTime = function(value, endTime) {
  this.minValue = Math.min(this.minValue, value);
  this.maxValue = Math.max(this.maxValue, value);
  this.duration = Math.max(this.duration, endTime);
};

AudioParam.prototype.exponentialRampToValueAtTime = function(value, endTime) {
  this.minValue = Math.min(this.minValue, value);
  this.maxValue = Math.max(this.maxValue, value);
  this.duration = Math.max(this.duration, endTime);
};

AudioParam.prototype.setTargetAtTime = function(target, startTime, timeConstant) {
  this.minValue = Math.min(this.minValue, target);
  this.maxValue = Math.max(this.maxValue, target);
  this.duration = Math.max(this.duration, startTime + timeConstant * 1.5);
};

AudioParam.prototype.setValueCurveAtTime = function(curve, startTime, duration) {
  for (var i = 0; i < curve.length; i++) {
    this.minValue = Math.min(this.minValue, curve[i]);
    this.maxValue = Math.max(this.maxValue, curve[i]);
  }
  this.duration = Math.max(this.duration, startTime + duration);
};

AudioParam.prototype.cancelScheduledValues = function() {
};

AudioParam.prototype.toJSON = function() {
  return {
    duration: this.duration,
    minValue: this.minValue,
    maxValue: this.maxValue,
  };
};

onmessage = function(e) {
  param = new AudioParam();
  try {
    eval.call(null, e.data);
    postMessage([ null, param.toJSON() ]);
  } catch (e) {
    postMessage([ e.toString(), null ]);
  }
};
