(function(global) {
  "use strict";

  var filename = "GIFEncoder.js";
  var slice = [].slice;
  
  if (typeof global.window !== "undefined") {
    
    (function(window) {
      var workerpath = (function(name) {
        var scripts = document.getElementsByTagName("script");
        if (scripts && scripts.length) {
          for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src.substr(src.lastIndexOf("/")+1) === name) {
              return src;
            }
          }
        }
      })(filename);
      
      var _onmessage = function(e) {
        switch (e.data.type) {
        case "console":
          console.log.apply(console, e.data.data);
          break;
        case "return":
          var dfd = this.pool[e.data.index];
          if (dfd) { dfd.resolve(e.data.data); }
          delete this.pool[e.data.index];
          break;
        }
      };
      
      var _send = function(type) {
        var index = this.index++;
        var data = slice.call(arguments, 1);
        if (data.length <= 1) {
          data = data[0];
        }
        var dfd = this.pool[index] = $.Deferred();
        this.worker.postMessage({type:type, index:index, data:data});
        return dfd.promise();
      };
      
      function GIFEncoder() {
        var worker = new Worker(workerpath);
        var privates = {worker:worker, index:0, pool:{}};
        var send = _send.bind(privates);
        
        worker.addEventListener("message", _onmessage.bind(privates));
        
        this.setDelay = function(ms) {
          return send("setDelay", ms);
        };

        this.setDispose = function(code) {
          return send("setDispose", code);
        };
        
        this.setRepeat = function(iter) {
          return send("setRepeat", iter);
        };

        this.setTransparent = function(c) {
          return send("setTransparent", c);
        };

        this.addFrame = function(im) {
          if (im instanceof CanvasRenderingContext2D) {
            im = im.getImageData(0, 0, im.canvas.width, im.canvas.height).data;
          }
          return send("addFrame", im);
        };

        this.finish = function() {
          return send("finish");
        };
        
        this.reset = function() {
          return send("reset");
        };

        this.setFrameRate = function(fps) {
          return send("setFrameRate", fps);
        };

        this.setQuality = function(quality) {
          return send("setQuality", quality);
        };

        this.setSize = function(w, h) {
          return send("setSize", w, h);
        };

        this.start = function() {
          return send("start");
        };

        this.stream = function() {
          return this;
        };
        
        this.getData = function(cb) {
          return send("getData");
        };
        
        send("init", workerpath);
      }
      
      window.GIFEncoder = GIFEncoder;
    })(global);
    
  } else {
    
    (function(worker) {
      var console = {
        log: function() {
          worker.postMessage({type:"console",data:slice.call(arguments)});
        }
      };
      var send = function(index, data) {
        worker.postMessage({type:"return", index:index, data:data});
      };
      
      var encoder;
      
      worker.addEventListener("message", function(e) {
        var data  = e.data.data;
        var index = e.data.index || 0;
        switch (e.data.type) {
        case "init":
          var path = data.substr(0, data.lastIndexOf(filename));
          importScripts(path + "_LZWEncoder.js");
          importScripts(path + "_NeuQuant.js");
          importScripts(path + "_GIFEncoder.js");
          encoder = new GIFEncoder();
          return send(index, true);
        case "setDelay":
          return send(index, encoder.setDelay(data));
        case "setDispose":
          return send(index, encoder.setDispose(data));
        case "setRepeat":
          return send(index, encoder.setRepeat(data));
        case "setTransparent":
          return send(index, encoder.setTransparent(data));
        case "addFrame":
          return send(index, encoder.addFrame(data, true));
        case "finish":
          return send(index, encoder.finish());
        case "reset":
          return send(index, encoder.reset());
        case "setFrameRate":
          return send(index, encoder.setFrameRate(data));
        case "setQuality":
          return send(index, encoder.setQuality(data));
        case "setSize":
          return send(index, encoder.setSize(data[0], data[1]));
        case "start":
          return send(index, encoder.start());
        case "getData":
          return send(index, encoder.stream().getData());
        }
        
      });
    })(global);
  }
  
})(this);
