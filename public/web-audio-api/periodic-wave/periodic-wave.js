var PeriodicWave = (function() {
  "use strict";

  var PeriodicWaveSize = 4096;
  var SINE = 0, SQUARE = 1, SAWTOOTH = 2, TRIANGLE = 3;

  function generateBasicWaveform(shape) {
    var halfSize = PeriodicWaveSize >> 1;
    var real = new Float32Array(halfSize);
    var imag = new Float32Array(halfSize);

    for (var n = 1; n < halfSize; n++) {
      var omega = 2 * Math.PI * n;
      var invOmega = 1 / omega;

      var a = 0, b = 0;

      switch (shape) {
      case SINE:
        // Standard sine wave function.
        a = 0;
        b = (n === 1) ? 1 : 0;
        break;
      case SQUARE:
        // Square-shaped waveform with the first half its maximum value and the second half its minimum value.
        a = 0;
        b = invOmega * ((n & 1) ? 2 : 0);
        break;
      case SAWTOOTH:
        // Sawtooth-shaped waveform with the first half ramping from zero to maximum and the second half from minimum to zero.
        a = 0;
        b = -invOmega * Math.cos(0.5 * omega);
        break;
      case TRIANGLE:
        // Triangle-shaped waveform going from its maximum value to its minimum value then back to the maximum value.
        a = (4 - 4 * Math.cos(0.5 * omega)) / (n * n * Math.PI * Math.PI);
        b = 0;
        break;
      }

      real[n] = a;
      imag[n] = b;
    }

    return { real: real, imag: imag };
  }

  return {
    createSine: function() {
      return generateBasicWaveform(SINE);
    },
    createSquare: function() {
      return generateBasicWaveform(SQUARE);
    },
    createSawtooth: function() {
      return generateBasicWaveform(SAWTOOTH);
    },
    createTriangle: function() {
      return generateBasicWaveform(TRIANGLE);
    }
  };

})();
