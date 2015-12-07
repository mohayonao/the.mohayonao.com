const BD = 0, SD = 1, HH = 2;
const rePattern = /^(?:(\d+(?:\.\d+)?);)?(\s*(?:[0-9a-fA-F]{6})+)$/;

export default class HexRhythmIterator {
  constructor(score = "") {
    this._bpm = 120;
    this._pattern = [ [], [], [] ];
    this._index = 0;
    this._time = 0;

    this.setScore(score);
  }

  setScore(score) {
    this._pattern = [ [ ], [ ], [ ] ];

    let matches = rePattern.exec(score.replace(/\s+/g, ""));

    if (matches) {
      let bpm = +matches[1] || 0;
      let pattern = matches[2];

      if (bpm < 20 || 300 < bpm) {
        bpm = 120;
      }
      this._bpm = bpm;

      for (let i = 0, imax = pattern.length / 6; i < imax; i++) {
        let hh = parseInt(pattern.substr(i * 6 + 0, 2), 16);
        let sd = parseInt(pattern.substr(i * 6 + 2, 2), 16);
        let bd = parseInt(pattern.substr(i * 6 + 4, 2), 16);

        for (let j = 7; j >= 0; j--) {
          this._pattern[HH].push(hh & (1 << j) ? 1 : 0);
          this._pattern[SD].push(sd & (1 << j) ? 1 : 0);
          this._pattern[BD].push(bd & (1 << j) ? 1 : 0);
        }
      }
    }
  }

  next() {
    let type = "note";
    let time = this._time;
    let interval = (60 / this._bpm) * 0.25;
    let hh = (wrapAt(this._pattern[HH], this._index) * wrapAt([ 0.20, 0.05, 0.15, 0.05 ], this._index)) || 0;
    let sd = (wrapAt(this._pattern[SD], this._index) * wrapAt([ 0.80, 0.40, 0.60, 0.40 ], this._index)) || 0;
    let bd = (wrapAt(this._pattern[BD], this._index) * wrapAt([ 0.60, 0.25, 0.50, 0.30 ], this._index)) || 0;
    let pattern = [ bd, sd, hh ];

    this._time += interval;
    this._index += 1;

    return {
      done: false,
      value: { type, time, pattern },
    };
  }
}

function wrapAt(list, index) {
  return list[index % list.length];
}
