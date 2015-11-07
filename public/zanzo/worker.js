importScripts("omggif.js");
importScripts("//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js");

function sum(list) {
  return list.reduce(function(a, b) {
    return a + b;
  }, 0);
}

function draw(src, dst, srcIndex, dstIndex) {
  dst[dstIndex++] = src[srcIndex++];
  dst[dstIndex++] = src[srcIndex++];
  dst[dstIndex++] = src[srcIndex++];
  dst[dstIndex++] = 255;
}

function overlay(src, dst, srcIndex, dstIndex, opacity) {
  dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
  dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
  dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
  dst[dstIndex++] = 255;
}

function copy(src, dst) {
  return dst.set(src);
}

function createImageLag(data) {
  var reader = new GifReader(data);
  var width = reader.width;
  var height = reader.height;
  var length = width * height * 4;

  postMessage({
    type: "init",
    args: [ reader.numFrames(), width, height ]
  });

  var frames = _.range(reader.numFrames()).map(function(index) {
    var frame = reader.frameInfo(index);

    frame.delay = Math.max(1, frame.delay);
    frame.index = index;

    return frame;
  });

  var totalDelay = sum(_.pluck(frames, "delay"));

  var interlace = new Uint16Array(_.flatten([
    _.range(0, height, 8),
    _.range(4, height, 8),
    _.range(2, height, 4),
    _.range(1, height, 2),
  ]));

  var canvas = new Uint8Array(length);
  var result = new Uint8Array(length);

  function process(tmp, opacity, ymap) {
    for (var y = 0; y < height; y++) {
      var srcIndex = y * width * 4;
      var dstIndex = ymap(y) * width * 4;

      for (var x = 0; x < width; x++) {
        if (tmp[srcIndex + 3] !== 0) {
          draw(tmp, canvas, srcIndex, srcIndex);
        }

        overlay(canvas, result, srcIndex, dstIndex, opacity);

        srcIndex += 4;
        dstIndex += 4;
      }
    }
    return null;
  }

  function loopFunc() {
    var frame = frames.shift();
    var opacity = frame.delay / totalDelay;
    var ymap = frame.interlaced ? function(y) {
      return interlace[y];
    } : _.identity;

    var tmp = new Uint8Array(length);

    reader.decodeAndBlitFrameRGBA(frame.index, tmp);

    process(tmp, opacity, ymap);
    copy(result, tmp);

    postMessage({
      type: "progress",
      args: [ tmp, frame.index ]
    }, [ tmp.buffer ]);

    if (frames.length !== 0) {
      return setTimeout(loopFunc, 0);
    }

    postMessage({
      type: "finish",
      args: [ result ]
    }, [ result.buffer ]);
  }

  loopFunc();
}

onmessage = function(e) {
  createImageLag(new Uint8Array(e.data));
};
