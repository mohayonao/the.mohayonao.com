function KarplusStrong(sampleRate, frequency, duration) {
  var buffer = new Float32Array(sampleRate * duration);

  var length = Math.round(sampleRate / frequency);
  var table  = new Float32Array(length);
  for (var i = 0; i < length; ++i) {
    table[i] = Math.random() * 2 - 1;
  }

  var next, prev = 0;
  for (var j = 0, k = 0, jmax = buffer.length; j < jmax; ++j) {
    buffer[j] = next = table[k];
    table[k] = (prev + next) * 0.5;
    prev = next;
    if (++k >= length) {
      k = 0;
    }
  }

  return buffer;
}
