import SeqEmitter from "seq-emitter";
import WorkerTimer from "worker-timer";
import HexRhythmIterator from "./HexRhythmIterator";
import memoize from "lodash.memoize";
import fetchAudioBuffer from "@mohayonao/web-audio-utils/fetchAudioBuffer";
import splitAudioBuffer from "@mohayonao/web-audio-utils/splitAudioBuffer";

const rePattern = /^(?:(\d+(?:\.\d+)?);)?(\s*(?:[0-9a-fA-F]{6})+)$/;
const HH = "55|55|55|88|88|88|88|88|88|aa|aa|aa|aa|aa|aa|aa|aa|aa|aa|aa|aa|bb|bb|bb|ff|ff|ff|ff|ff|ff|ff|ff|ff|ae|ae|ae|ae|ae|ae|[0-9a-f]{2}";
const SD = "[002][8899b]|[002][8899b]|[002][8899b]|[002][8899b]|[002][8899b]|[0-9a-f]{2}";
const BD = "[8a][288aab]|[8a][288aab]|[8a][288aab]|[8a][288aab]|[8a][288aab]|[0-9a-f]{2}";

let fetchDrumKit = memoize((path, audioContext) => {
  return fetchAudioBuffer(path, audioContext).then((audioBuffer) => {
    return splitAudioBuffer(audioBuffer, 4);
  });
});

export default class HexRhythmMachine {
  constructor(audioContext) {
    this.audioContext = audioContext;

    this._hexRhythmIterator = null;
    this._sequencer = null;
    this._score = "";
    this._drumkit = [];
    this._isPlaying = false;
    this._hasError = false;

    fetchDrumKit("./drumkit.wav", audioContext).then((drumkit) => {
      this._drumkit = drumkit;
    });
  }

  get state() {
    return this._isPlaying ? "playing" : "paused";
  }

  get hasError() {
    return this._hasError;
  }

  start() {
    if (!this._isPlaying) {
      this._hexRhythmIterator = new HexRhythmIterator();
      this._hexRhythmIterator.setScore(this._score);
      this._sequencer = new SeqEmitter([ this._hexRhythmIterator ], {
        context: this.audioContext, timerAPI: WorkerTimer,
      });
      this._sequencer.on("note", ({ playbackTime, pattern }) => {
        pattern.forEach((amp, index) => {
          this.playNote(playbackTime, this._drumkit[index], amp)
        });
      });
      this._sequencer.start(this.audioContext.currentTime + 0.05);
    }
    this._isPlaying = true;
  }

  stop() {
    if (this._isPlaying) {
      this._sequencer.stop();
      this._hexRhythmIterator = null;
      this._sequencer = null;
    }
    this._isPlaying = false;
  }

  setScore(score) {
    if (rePattern.test(score.replace(/\s+/g, ""))) {
      if (this._hexRhythmIterator) {
        this._hexRhythmIterator.setScore(score);
      }
      this._score = score;
      this._hasError = false;
    } else {
      this._hasError = true;
    }
  }

  makeRandomScore(cnt) {
    return String_random(`(1[046]0; )?((${HH})(${SD})(${BD}) )${cnt}`).trim();
  }

  playNote(playbackTime, buffer, amp) {
    if (amp === 0 || !buffer) {
      return;
    }

    let t0 = playbackTime;
    let t1 = t0 + buffer.duration;
    let bufSrc = this.audioContext.createBufferSource();
    let gain = this.audioContext.createGain();

    bufSrc.buffer = buffer;
    bufSrc.start(t0);
    bufSrc.stop(t1);
    bufSrc.connect(gain);

    gain.gain.value = amp;
    gain.connect(this.audioContext.destination);

    bufSrc.onended = () => {
      bufSrc.disconnect();
      gain.disconnect();
    };
  }
}
