import SheetMusic from "./SheetMusic";
import ScalableSequencer from "./ScalableSequencer";
import Scales from "./Scales";
import findIndex from "lodash.findindex";
import sortBy from "lodash.sortBy";

const AudioContext = window.AudioContext || window.webkitAudioContext;

export default function main() {
  let audioContext = new AudioContext();
  let sequencer = new ScalableSequencer(audioContext, SheetMusic.mario);

  let app = new Vue({
    el: "#app",
    data: {
      isPlaying: false,
      selected: "Ionian",
      scales: sortBy(Scales, x => x.name),
    },
    methods: {
      select(index) {
        sequencer.setDegrees(this.scales[index].degrees);
        this.selected = this.scales[index].name;
      },
      play() {
        chore(audioContext);
        if (this.isPlaying) {
          sequencer.stop();
        } else {
          sequencer.start();
        }
        this.isPlaying = !this.isPlaying;
      },
      random() {
        this.select(Math.floor(this.scales.length * Math.random()));
      },
      tweet() {
        tweet({
          text: "scalable mario",
          url: window.location.href,
        });
      }
    }
  });

  app.$watch("selected", (value) => {
    window.location.replace(`#${encodeURI(value)}`);
  });

  if (window.location.hash) {
    let selected = decodeURI(window.location.hash.slice(1));
    let index = findIndex(app.scales, ({ name }) => name === selected);

    if (index !== -1) {
      app.select(index);
    }
  }
}

function tweet(params) {
  let w = 550;
  let h = 420;
  let l = Math.round (screen.width  - w) * 0.5;
  let t = Math.round (screen.height - h) * 0.5;
  let url = `https://twitter.com/intent/tweet?${toParams(params)}`;

  window.open(url, "intent", `width=${w},height=${h},left=${l},top=${t}`);
}

function toParams(params) {
  let result = [];

  Object.keys(params).forEach((key) => {
    result.push(`${key}=${encodeURIComponent(params[key])}`);
  });

  return result.join("&");
}

function chore(audioContext) {
  if (chore.done) {
    return;
  }

  let bufSrc = audioContext.createBufferSource();
  let buffer = audioContext.createBuffer(1, 4, audioContext.sampleRate);

  buffer.getChannelData(0).set([ 0, 0, 0, 0 ]);
  bufSrc.buffer = buffer;
  bufSrc.start(audioContext.currentTime);
  bufSrc.stop(audioContext.currentTime);
  bufSrc.connect(audioContext.destination);
  bufSrc.onended = () => {
    bufSrc.disconnect();
  };
}
