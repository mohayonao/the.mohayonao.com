export default class ScaleChanger {
  constructor() {
    this.degrees1 = [ 0, 2, 4, 5, 7, 9, 11 ];
    this.degrees2 = [ 0, 2, 4, 5, 7, 9, 11 ];
  }

  setDegrees(degrees) {
    this.degrees2 = degrees;
  }

  change(noteNumber) {
    let deg = keyToDegree(this.degrees1, noteNumber - 60);
    let key = degreeToKey(this.degrees2, deg);

    return key + 60;
  }
}

function keyToDegree(scale, key) {
  let n = Math.floor(key / 12) * scale.length;
  let m = key % 12;

  return indexInBetween(scale, m) + n;
}

function degreeToKey(scale, degree) {
  let octave = Math.floor(degree / scale.length);
  let index = iwrap(degree, scale.length);

  return blendAt(scale, index) + octave * 12;
}

function indexInBetween(list, value) {
  for (let i = 0; i < list.length - 1; i++) {
    if (list[i] <= value && value < list[i + 1]) {
      return linlin(value, list[i], list[i + 1], i, i + 1);
    }
  }
  return list.length - 1;
}

function iwrap(index, length) {
  index %= length;

  if (index < 0) {
    index += length;
  }

  return index;
}

function blendAt(list, index) {
  let i = index | 0;
  let j = index % 1;

  if (j === 0) {
    return i < list.length ? list[i] : 12;
  }

  let a = list[i];
  let b = list[i + 1] || 12;

  return a * (1 - j) + b * j;
}

function linlin(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}
