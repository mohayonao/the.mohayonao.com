window.onload = function() {
  "use strict";
  
  var container, width, height;
  var camera, scene, renderer;
  container = document.getElementById('container')
  
  width  = $(container).width();
  height = 640; // $(container).height();
  
  camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
  camera.position.set(-1000, 600, -700);
  
  scene = new THREE.Scene();
  scene.add(camera);
  
  renderer = new THREE.CanvasRenderer();
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  
  // Grid
  (function(scene) {
    var lineMaterial, geometry, line, i;
    lineMaterial = new THREE.LineBasicMaterial({color: 0x666666, opacity:0.5});
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vertex( new THREE.Vector3(-1000, 0, 0)));
	geometry.vertices.push(new THREE.Vertex( new THREE.Vector3( 1000, 0, 0)));
	for (i = 0; i <= 20; i ++ ) {
	  line = new THREE.Line(geometry, lineMaterial);
	  line.position.z = (i * 100) - 1000;
	  scene.add(line);
      
	  line = new THREE.Line(geometry, lineMaterial);
	  line.position.x = (i * 100) - 1000;
	  line.rotation.y = 90 * Math.PI / 180;
	  scene.add(line);
	}
  }(scene));
  
  
  MotionMan.prototype.init = function(color) {
    var children, i, imax;
    
    children = this.children;
    for (i = 0, imax = children.length; i < imax; i++) {
      children[i].material.color = new THREE.Color(color);
    }
  };
  
  MotionMan.prototype.createObject = function(options) {
    var o, size, color;
    var DATATABLE = MotionMan.DATATABLE;
    if (DATATABLE[options.name]) {
      size  = DATATABLE[options.name].size;
      color = DATATABLE[options.name].color;
    }
    if (typeof(size ) === "undefined") size  = 1;
    if (typeof(color) === "undefined") color = 0xffffff;
    
    o = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({
	  color:color, opacity: 0.6
	}));
    o.name = options.name;
    o.scale.x = o.scale.y = o.scale.z = size;
    return o;
  };
  
  MotionMan.prototype.draw = function(a) {
    var children, o, i, imax;
    
    // re-position
    children = this.children;
    for (i = 0, imax = a.length/3; i < imax; i++) {
      o = children[i];
      o.position.x = +a[i * 3 + 0];
      o.position.y = +a[i * 3 + 1] * 2;
      o.position.z = +a[i * 3 + 2] * 2 + 200;
      
      o.rotation.x = rx;
      o.rotation.y = ry;
      o.rotation.z = rz;
    }
  };
  
  var A = new MotionMan({name:"aachan"});
  var K = new MotionMan({name:"kashiyuka"});
  var N = new MotionMan({name:"nocchi"});
  A.geometry = K.geometry = N.geometry = new THREE.CubeGeometry(5, 5, 10);
  A.position.set(-300, 0, -200);
  K.position.set(-200, 0,  245);
  N.position.set( 400, 0, -200);

  var bvh_url;
  var $msg = jQuery("#message");
  
  $msg.text("aachan loading...");
  bvh_url = apps.isMobile ? "../spring-of-life-01.min.bvh" : "../spring-of-life-01.bvh";
  A.load(bvh_url, function(msg) {
    if (msg !== "buildend") return;
    A.init(0xff3333);
    scene.add(A);
    
    $msg.text("kashiyuka loading...");
    bvh_url = apps.isMobile ? "../spring-of-life-02.min.bvh" : "../spring-of-life-02.bvh";
    K.load(bvh_url, function(msg) {
      if (msg !== "buildend") return;
      K.init(0x339933);
      scene.add(K);
      
      $msg.text("nocchi loading...");
      bvh_url = apps.isMobile ? "../spring-of-life-03.min.bvh" : "../spring-of-life-03.bvh";
      N.load(bvh_url, function(msg) {
        if (msg !== "buildend") return;
        N.init(0x6666ff);
        scene.add(N);
        
        if (apps.isDesktop) $msg.text("SPC:glitch, [j,k]:efx");
      });
    });
  });
  
  var processor;
  var time1, time2;
  var rx, ry, rz, RX, RY, RZ;
  time1 = time2 = 0;
  rx = ry = rz = RX = RY = 0;
  RZ = 0.05;
  
  var mouseX = -200 + (width /2);
  var mouseY =  300 + (height/4);
  if (apps.isTouchDevice) {
    document.addEventListener("touchstart", function(e) {
      if (e.touches.length == 1) {
		mouseX = e.touches[0].pageX;
		mouseY = e.touches[0].pageY;
      }
    }, false);
    document.addEventListener("touchmove", function(e) {
      if (e.touches.length == 1) {
        e.preventDefault();
		mouseX = e.touches[0].pageX;
		mouseY = e.touches[0].pageY;
      }
    }, false);
  } else {
    document.addEventListener("mousemove", function(e) {
	  mouseX = e.offsetX || e.layerX;
      mouseY = e.offsetY || e.layerY;
    }, false);

    (function() {
      var freqTable = [0, 0.5, 1, 2, 3, 4];
      var freqIndex = 3;
      document.addEventListener("keydown", function(e) {
        switch (e.keyCode) {
        case 32:
          processor.glitchmode = 1;
          break;
        case 74:
          freqIndex -= 1;
          if (freqIndex < 0) freqIndex = 0;
          processor.setFrequency(freqTable[freqIndex]);
          break;
        case 75:
          freqIndex += 1;
          if (freqTable.length <= freqIndex) freqIndex = freqTable.length - 1;
          processor.setFrequency(freqTable[freqIndex]);
          break;
        }
      }, false);
    }());
  }

  var animate = (function() {
    var prevTime = 0;
    return function animate() {
      var mx, my;
      
      mx = (mouseX - (width /2)) * 5;
      my = (mouseY - (height/4)) * 2;
	  camera.position.x += (mx - camera.position.x) * 0.05;
	  camera.position.y += (my - camera.position.y) * 0.05;

      if (prevTime !== time1) {
        A.update(time1);
        K.update(time1);
        N.update(time1);
        prevTime = time1;
      }
      
	  camera.lookAt(scene.position);
	  renderer.render(scene, camera);
      
      requestAnimationFrame(animate);
    }
  }());
  
  var audio = document.getElementById("audio");
  if (audio.canPlayType("audio/ogg")) {
    audio.src = "../perfume.ogg";
  } else {
    audio.src = "../perfume.mp3";
  }
  $(audio).on("loadeddata", function() {
    audio.play();
  });
  $(audio).one("play", function() {
    if (main) main();
    animate();
  });
  audio.loop = true;
  
  var AudioProcessor = (function() {
    var AudioProcessor = function() {
      initialize.apply(this, arguments);
    }, $this = AudioProcessor.prototype;

    var sinetable = (function() {
      var list, i;
      list = new Float32Array(1024);
      for (i = 0; i < 1024; i++) {
        list[i] = Math.sin(Math.PI * 2 * (i / 1024));
      }
      return list;
    }());
    
    var initialize = function(options) {
      this.samplerate = options.samplerate;
      this.buffer = new Float32Array(this.samplerate * 2);
      
      this.muted = false;
      this.glitchmode = 0;
      
      this.recIndex = this.samplerate >> 2;
      this.plyIndex = 0;
      
      this.phase = 0;
      this.phaseStep = 1024 * 2 / this.samplerate;
      
      this.savedtime = 0;
    };
    
    $this.setFrequency = function(value) {
      this.phaseStep = 1024 * value / this.samplerate;
    };
    
    $this.process = function(stream) {
      var buffer, recIndex, plyIndex;
      var phase, phaseStep, glitchbuffer;
      var idx, x, i, imax;
      
      time1 = time2 = (audio.currentTime || 0) * 1000;
      
      buffer   = this.buffer;
      recIndex = this.recIndex;
      for (i = 0, imax = stream.length; i < imax; i++) {
        buffer[recIndex] = stream[i];
        recIndex += 1;
        if (recIndex >= buffer.length) recIndex = 0;
      }
      
      phase     = this.phase;
      phaseStep = this.phaseStep;
      plyIndex  = this.plyIndex;
      for (i = 0, imax = stream.length; i < imax; i++) {
        idx = plyIndex + sinetable[(phase|0) % 1024] * 128;
        x   = buffer[idx|0] || 0.0;
        stream[i] = (buffer[plyIndex] * 0.5) + (x * 0.5);
        plyIndex += 1;
        if (plyIndex >= buffer.length) plyIndex = 0;
        
        phase += phaseStep;
      }
      
      // glitch
      if (this.glitchmode === 0 && Math.random() < 0.010) {
        this.glitchmode = 1;
      }
      if (this.glitchmode === 1) {
        this.glitchmode = 2;
        this.glitchbuffer = [];
        this.glitchbufferLength = ((Math.random() * 10)|0) + 1;
        this.savedtime = time1;
        RY = 5;
      }
      if (this.glitchmode === 2) {
        this.glitchbuffer.push(new Float32Array(stream));
        if (this.glitchbuffer.length === this.glitchbufferLength) {
          this.glitchmode  = 3;
          this.glitchindex = 0;
          this.glitchindexMax = ((Math.random() * 12)|0) + 2;
          RY = 0;
        }
      }
      
      if (this.glitchmode === 3) {
        glitchbuffer = this.glitchbuffer[this.glitchindex % this.glitchbufferLength];
        for (i = 0, imax = stream.length; i < imax; i++) {
          stream[i] = glitchbuffer[i];
        }
        this.glitchindex += 1;
        if (this.glitchindex === this.glitchindexMax) {
          this.glitchmode = 4;
          this.glitchindex = (((Math.random() * 12)|0) * 4) + 10;
          rx = ( Math.random() * 360 ) * Math.PI / 180;
        }
        time1 = this.savedtime;
      }
      
      if (this.glitchmode === 4) {
        this.glitchindex -= 1;
        if (this.glitchindex === 0) {
          this.glitchmode = 0;
          time1 = time2;
        }
      }
      
      rx += RX;
      ry += RY;
      rz += RZ;

      if (this.muted) {
        for (i = 0, imax = stream.length; i < imax; i++) {
          stream[i] = 0.0;
        }
      }
      
      this.phase    = phase;
      this.recIndex = recIndex;
      this.plyIndex = plyIndex;
    };
    
    return AudioProcessor;
  }());
  
  var main;
  if (window.webkitAudioContext) {
    main = function() {
      var audioContext = new webkitAudioContext();
      var media = audioContext.createMediaElementSource(audio);
      var node  = audioContext.createJavaScriptNode(1024, 1, 1);
      var gain  = audioContext.createGainNode();
      var stream = new Float32Array(node.bufferSize);
      
      processor = new AudioProcessor({samplerate:audioContext.sampleRate});
      
      node.onaudioprocess = function(e) {
        stream.set(e.inputBuffer.getChannelData(0));
        processor.process(stream);
        e.outputBuffer.getChannelData(0).set(stream);
      };
      media.connect(node);
      node.connect(audioContext.destination);
      
      gain.gain.value = 0;      
      media.connect(gain);
      gain.connect(audioContext.destination);
    };
  } else if (audio.mozSetup) {
    main = function() {
      var output = new Audio();
      audio.addEventListener("loadedmetadata", function(e) {
        audio.volume = 0;
        output.mozSetup(audio.mozChannels, audio.mozSampleRate);
        processor = new AudioProcessor({samplerate:audio.mozSampleRate});
      }, false);
      audio.addEventListener("MozAudioAvailable", function(e) {
        var stream = new Float32Array(e.frameBuffer);  
        processor.process(stream);
        output.mozWriteAudio(stream);
      }, false);
      audio.load();
    };
  }
  
  audio.load();
};
