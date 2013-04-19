window.onload = function() {
  "use strict";

  var container, width, height;
  var camera, scene, renderer;
  container = document.getElementById('unit')
  
  width  = $(container).width();
  height = 640; // $(container).height();
  
  camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
  camera.position.set(0, 200, 300);
  
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

  var A = new MotionMan({name:"aachan"});
  var K = new MotionMan({name:"kashiyuka"});
  var N = new MotionMan({name:"nocchi"});
  
  var bvh_url;
  var $msg = jQuery("#message");
  
  $msg.text("aachan loading...");
  bvh_url = apps.isMobile ? "../spring-of-life-01.min.bvh" : "../spring-of-life-01.bvh";
  A.load(bvh_url, function(msg) {
    if (msg !== "buildend") return;
    scene.add(A);
    
    $msg.text("kashiyuka loading...");
    bvh_url = apps.isMobile ? "../spring-of-life-02.min.bvh" : "../spring-of-life-02.bvh";
    K.load(bvh_url, function(msg) {
      if (msg !== "buildend") return;
      scene.add(K);
      
      $msg.text("nocchi loading...");
      bvh_url = apps.isMobile ? "../spring-of-life-03.min.bvh" : "../spring-of-life-03.bvh";
      N.load(bvh_url, function(msg) {
        if (msg !== "buildend") return;
        scene.add(N);
        $msg.text("");
      });
    });
  });
  
  
  var mouseX = width /2;
  var mouseY = height/2;
  
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
  }
  
  var animate = (function() {
    var prevTime = 0;
    var halfWidth  = width >> 1;
    return function animate() {
      var time, dx, mx, my, mz;
      time = (audio.currentTime || 0) * 1000;
      
      dx = (mouseX - halfWidth ) / halfWidth;
      mx = Math.sin(Math.PI * dx) * 300;
      mz = Math.cos(Math.PI * dx) * 300;
      my = (mouseY - (height/4)) * 2;
	  camera.position.x += (mx - camera.position.x) * 0.05;
	  camera.position.y += (my - camera.position.y) * 0.05;
	  camera.position.z += (mz - camera.position.z) * 0.05;
      
      if (prevTime !== time) {
        A.update(time);
        K.update(time);
        N.update(time);
        prevTime = time;
      }
      
	  camera.lookAt(scene.position);
	  renderer.render(scene, camera);
      
      requestAnimationFrame(animate);
   	};
  }());
  
  var audio = document.getElementById("audio");
  if (audio.canPlayType("audio/ogg")) {
    audio.src = "../perfume.ogg";
  } else {
    audio.src = "../perfume.mp3";
  }
  $(audio).one("play", function() {
    animate();  
  });
  audio.loop = true;
  
  audio.load();
};
