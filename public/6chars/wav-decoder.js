(function() {
  "use strict";

  function WavDecoder() {}

  var _24bit_to_32bit = function(uint8) {
    var b0, b1, b2, bb, x;
    var int32 = new Int32Array(uint8.length / 3);
    for (var i = 0, imax = uint8.length, j = 0; i < imax; ) {
      b0 = uint8[i++] ,b1 = uint8[i++], b2 = uint8[i++];
      bb = b0 + (b1 << 8) + (b2 << 16);
      x = (bb & 0x800000) ? bb - 16777216 : bb;
      int32[j++] = x;
    }
    return int32;
  };

  WavDecoder.load = function(path, callback) {
    var dfd;
    if (typeof $ !== "undefined" && typeof $.Deferred === "function") {
      dfd = new $.Deferred();
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function() {
      var result;
      if (xhr.readyState === 4) {
        if (xhr.response) {
          result = new Uint8Array(xhr.response);
        } else if (typeof xhr.responseBody !== "undefined") {
          new Uint8Array(VBArray(xhr.responseBody).toArray())          
        }
        if (result) {
          result = new WavDecoder().decode(result);
          if (callback) {
            callback(result);
          }
          if (dfd) {
            dfd.resolve(result);
          }
        } else {
          if (callback) {
            callback({err:true});
          }
          if (dfd) {
            dfd.reject();
          }
        }
      }
    };
    xhr.send();
    if (dfd) {
      return dfd.promise();
    }
  };
  
  WavDecoder.prototype.decode = function(data) {
    var i = 0;
    if (String.fromCharCode(data[i++], data[i++], data[i++], data[i++]) !== "RIFF") {
      return false;
    }
    var l1 = data[i++] + (data[i++]<<8) + (data[i++]<<16) + (data[i++]<<24);
    if (l1 + 8 !== data.length) {
      return false;
    }
    if (String.fromCharCode(data[i++], data[i++], data[i++], data[i++]) !== "WAVE") {
      return false;
    }
    if (String.fromCharCode(data[i++], data[i++], data[i++], data[i++]) !== "fmt ") {
      return false;
    }
    i += 4; // ByteLength
    i += 2; // FormatID
    var channels   = data[i++] + (data[i++]<<8);
    var samplerate = data[i++] + (data[i++]<<8) + (data[i++]<<16) + (data[i++]<<24);
    i += 4; // DataSpeed
    i += 2; // BlockSize
    var bitSize = data[i++] + (data[i++]<<8);
    while (i < data.length) {
      if (String.fromCharCode(data[i], data[i+1], data[i+2], data[i+3]) === "data") {
        break;
      }
      i += 1;
    }
    if (i >= data.length) {
      return false;
    }
    i += 4;

    var l2 = data[i++] + (data[i++]<<8) + (data[i++]<<16) + (data[i++]<<24);
    var duration = ((l2 / channels) >> 1) / samplerate;
    
    if (l2 > data.length - i) {
      return false;
    }

    switch (bitSize) {
    case 8:
      data = new Int8Array(data.buffer, i);
      break;
    case 16:
      data = new Int16Array(data.buffer, i);
      break;
    case 32:
      data = new Int32Array(data.buffer, i);
      break;
    case 24:
      data = _24bit_to_32bit(new Uint8Array(data.buffer, i));
      break;
    }

    var buffer = [];
    for (i = 0; i < channels; i++) {
      buffer[i] = new Float32Array(data.length / channels);
    }
    var k = 1 / ((1 << (bitSize-1)) - 1);
    var imax = data.length;
    for (i = 0; i < imax; i++) {
      buffer[i % channels][(i/channels)|0] = data[i] * k;
    }
    
    return {
      samplerate: samplerate,
      channels  : channels,
      buffer    : buffer
    };
  };

  window.WavDecoder = WavDecoder;

})();
