module.exports = (code, length, sampleRate, callback) => {
  let audioContext = new OfflineAudioContext(1, length, sampleRate);
  let buffer = audioContext.createBuffer(1, 4, sampleRate);
  let bufSrc = audioContext.createBufferSource();
  let gain = audioContext.createGain();

  buffer.getChannelData(0).set(new Float32Array([ 1, 1, 1, 1 ]));
  bufSrc.buffer = buffer;
  bufSrc.loop = true;
  bufSrc.start(0);
  bufSrc.connect(gain);

  gain.connect(audioContext.destination);

  window.param = gain.gain;
  try {
    eval.call(null, code);
  } catch (e) {
    return showErrorMessage(e.toString());
  } finally {
    delete window.param;
  }

  audioContext.oncomplete = (e) => {
    callback(e.renderedBuffer.getChannelData(0));
  };
  audioContext.startRendering();
};
