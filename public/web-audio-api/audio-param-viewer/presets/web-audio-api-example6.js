var curveLength = 44100;
var curve = new Float32Array(curveLength);
for (var i = 0; i < curveLength; ++i)
    curve[i] = Math.sin(Math.PI * i / curveLength);

var t0 = 0;
var t1 = 0.1;
var t2 = 0.2;
var t3 = 0.3;
var t4 = 0.325;
var t5 = 0.5;
var t6 = 0.6;
var t7 = 0.7;
var t8 = 1.0;
var timeConstant = 0.1;

param.setValueAtTime(0.2, t0);
param.setValueAtTime(0.3, t1);
param.setValueAtTime(0.4, t2);
param.linearRampToValueAtTime(1, t3);
param.linearRampToValueAtTime(0.8, t4);
param.setTargetAtTime(.5, t4, timeConstant);
// Compute where the setTargetAtTime will be at time t5 so we can make
// the following exponential start at the right point so there's no
// jump discontinuity.  From the spec, we have
//   v(t) = 0.5 + (0.8 - 0.5)*exp(-(t-t4)/timeConstant)
// Thus v(t5) = 0.5 + (0.8 - 0.5)*exp(-(t5-t4)/timeConstant)
param.setValueAtTime(0.5 + (0.8 - 0.5)*Math.exp(-(t5 - t4)/timeConstant), t5);
param.exponentialRampToValueAtTime(0.75, t6);
param.exponentialRampToValueAtTime(0.05, t7);
param.setValueCurveAtTime(curve, t7 + 1e-4, t8 - t7);
