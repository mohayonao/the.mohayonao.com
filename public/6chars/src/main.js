import sample from "lodash.sample";
import HexRhythmMachine from "./HexRhythmMachine";

const AudioContext = window.AudioContext || window.webkitAudioContext;
const ExamplePatterns = [ 2, 2, 4, 4, 8, 8, 0, 0, 0, 0 ];

export default function main() {
  let audioContext = new AudioContext();
  let sequencer = new HexRhythmMachine(audioContext);

  let app = new global.Vue({
    el: "#app",
    data: {
      score: "",
      list: ExamplePatterns.map(() => ""),
      hasError: false,
      isPlaying: false,
    },
    methods: {
      encodeURI: encodeURI,
      play() {
        chore(audioContext);
        if (sequencer.state === "playing") {
          sequencer.stop();
          this.isPlaying = false;
        } else {
          sequencer.start();
          this.isPlaying = true;
        }
      },
      random() {
        ExamplePatterns.forEach((n, i) => {
          let cnt = n !== 0 ? `{${n}}` : "+";

          this.list.$set(i, sequencer.makeRandomScore(cnt));
        });
        this.score = sample(this.list);
      },
      tweet() {
        tweet({
          text: "6chars drums",
          url: `http://${location.host}/6chars/#${encodeURI(this.score)}`,
        });
      },
    },
  });

  app.$watch("score", () => {
    sequencer.setScore(app.score);
    app.hasError = sequencer.hasError;
    if (!app.hasError) {
      window.location.replace(`#${encodeURI(app.score.trim())}`);
    }
  });

  window.onhashchange = () => {
    app.score = decodeURI(window.location.hash.substr(1).trim());
  };

  app.random();

  if (window.location.hash) {
    window.onhashchange();
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
