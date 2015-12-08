import MMLEmitter from "mml-emitter";
import WorkerTimer from "worker-timer";
import ScaleChanger from "./ScaleChanger";

export default class ScalableSequencer {
  constructor(audioContext, mml) {
    this.audioContext = audioContext;
    this.mml = mml;

    this._mmlEmitter = null;
    this._scaleChanger = new ScaleChanger();
  }

  start() {
    if (this._mmlEmitter === null) {
      this._mmlEmitter = new MMLEmitter(this.mml, {
        context: this.audioContext, timerAPI: WorkerTimer,
      });
      this._mmlEmitter.on("note", (e) => {
        this.playNote(e);
      });
      this._mmlEmitter.start(this.audioContext.currentTime + 0.05);
    }
  }

  stop() {
    if (this._mmlEmitter !== null) {
      this._mmlEmitter.stop();
    }
  }

  setDegrees(degrees) {
    this._scaleChanger.setDegrees(degrees);
  }

  playNote(e) {
    let audioContext = this.audioContext;
    let t0 = e.playbackTime;
    let t1 = t0 + 0.25;
    let osc = audioContext.createOscillator();
    let amp = audioContext.createGain();
    let noteNumber = this._scaleChanger.change(e.noteNumber);

    osc.type = "square";
    osc.frequency.value = mtof(noteNumber);
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.setValueAtTime(0.1, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t1);
    amp.connect(audioContext.destination);

    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  }
}

function mtof(value) {
  return 440 * Math.pow(2, (value - 69) / 12);
}
