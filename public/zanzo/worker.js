(function() {
  'use strict';
  var draw, overlay, sum;

  importScripts('./libs/omggif.js');

  importScripts('//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js');

  sum = function(list) {
    return _.reduce(list, (function(a, b) {
      return a + b;
    }), 0);
  };

  draw = function(src, dst, srcIndex, dstIndex) {
    dst[dstIndex++] = src[srcIndex++];
    dst[dstIndex++] = src[srcIndex++];
    dst[dstIndex++] = src[srcIndex++];
    return dst[dstIndex++] = 255;
  };

  overlay = function(src, dst, srcIndex, dstIndex, opacity) {
    dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
    dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
    dst[dstIndex++] += Math.floor(src[srcIndex++] * opacity);
    return dst[dstIndex++] = 255;
  };

  addEventListener('message', function(e) {
    var canvas, frames, height, interlace, length, loopFunc, reader, result, totalDelay, width;
    reader = new GifReader(new Uint8Array(e.data));
    width = reader.width, height = reader.height;
    length = width * height * 4;
    postMessage({
      type: 'info',
      args: [reader.numFrames(), width, height]
    });
    frames = _.range(reader.numFrames()).map(function(i) {
      var frame;
      frame = reader.frameInfo(i);
      frame.delay = Math.max(1, frame.delay);
      frame.index = i;
      return frame;
    });
    totalDelay = sum(_.pluck(frames, 'delay'));
    interlace = new Uint16Array(_.flatten([_.range(0, height, 8), _.range(4, height, 8), _.range(2, height, 4), _.range(1, height, 2)]));
    canvas = new Uint8Array(length);
    result = new Uint8Array(length);
    loopFunc = function() {
      var dstIndex, frame, opacity, srcIndex, tmp, x, y, ymap, _i, _j;
      frame = frames.shift();
      opacity = frame.delay / totalDelay;
      ymap = !frame.interlaced ? _.identity : function(y) {
        return interlace[y];
      };
      tmp = new Uint8Array(length);
      reader.decodeAndBlitFrameRGBA(frame.index, tmp);
      for (y = _i = 0; _i < height; y = _i += 1) {
        srcIndex = y * width * 4;
        dstIndex = ymap(y) * width * 4;
        for (x = _j = 0; _j < width; x = _j += 1) {
          if (tmp[srcIndex + 3] !== 0) {
            draw(tmp, canvas, srcIndex, srcIndex);
          }
          overlay(canvas, result, srcIndex, dstIndex, opacity);
          dstIndex += 4;
          srcIndex += 4;
        }
      }
      tmp.set(result);
      postMessage({
        type: 'progress',
        args: [tmp, frame.index]
      }, [tmp.buffer]);
      if (frames.length === 0) {
        return postMessage({
          type: 'result',
          args: [result]
        }, [result.buffer]);
      } else {
        return setTimeout(loopFunc, 0);
      }
    };
    return loopFunc();
  });

}).call(this);
