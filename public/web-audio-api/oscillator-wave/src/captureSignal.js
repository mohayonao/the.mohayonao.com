module.exports = (type, frequency, sampleRate, callback) => {
  let length = Math.ceil(sampleRate / frequency);
  let audioContext = new OfflineAudioContext(1, length, sampleRate);
  let oscillator = audioContext.createOscillator();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.start(0);
  oscillator.stop(length * sampleRate);
  oscillator.connect(audioContext.destination);

  audioContext.oncomplete = (e) => {
    callback(e.renderedBuffer.getChannelData(0));
  };
  audioContext.startRendering();
};
