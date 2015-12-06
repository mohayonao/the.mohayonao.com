export default class BufferSourceGain {
  constructor(audioContext) {
    this.audioContext = audioContext;

    this._bufSrc = audioContext.createBufferSource();
    this._gain = audioContext.createGain();

    this._bufSrc.connect(this._gain);
  }

  get buffer() {
    return this._bufSrc.buffer;
  }

  set buffer(value) {
    this._bufSrc.buffer = value;
  }

  get onended() {
    return this._bufSrc.onended;
  }

  set onended(callback) {
    this._bufSrc.onended = callback;
  }

  get gain() {
    return this._gain.gain;
  }

  start(t0) {
    this._bufSrc.start(t0);
  }

  stop(t0) {
    this._bufSrc.stop(t0);
  }

  connect(destination) {
    if (destination.__connectFrom) {
      destination.__connectFrom(this._gain);
    } else {
      this._gain.connect(destination);
    }
  }

  dispose() {
    this._bufSrc.disconnect();
    this._gain.disconnect();
  }
}
