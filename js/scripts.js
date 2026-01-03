// Variables globales
let handPose;
let video;
let hands = [];
let figureName = "Cubo"; 

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  console.log("Cargando modelo HandPose 1.0...");
  
  let options = {
    flipped: false, 
    maxHands: 2
  };

  handPose = ml5.handPose(options, modelReady);
  setupUI();
}

function modelReady() {
  console.log("Modelo listo! Iniciando detección...");
  const loadingScreen = document.getElementById("loading-model-message-container");
  if(loadingScreen) loadingScreen.style.display = "none";

  setTimeout(() => {
      if(handPose) {
        handPose.detectStart(video, gotHands);
      }
  }, 500);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 1. Fondo de video
  push();
  translate(-width / 2, -height / 2);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height); 
  pop();

  // Variables UI
  let dualModeEl = document.getElementById("dualMode");
  let gestureSizeEl = document.getElementById("gestureSize");
  let sizeSliderEl = document.getElementById("sizeSlider");

  let isDualMode = dualModeEl ? dualModeEl.checked : true;
  let isGestureSize = gestureSizeEl ? gestureSizeEl.checked : false;
  
  let gestureActive = false;

  // --- LÓGICA DE ESTIRAR Y CENTRAR (SIN LÍNEA AMARILLA) ---
  if (isGestureSize && hands.length >= 2) {
      let p1 = hands[0].keypoints[9];
      let p2 = hands[1].keypoints[9];

      if (p1 && p2) {
          // A. Calcular Distancia (Tamaño)
          let distance = dist(p1.x, p1.y, p2.x, p2.y);
          let newSize = map(distance, 50, 400, 20, 300);
          newSize = constrain(newSize, 20, 300);
          if (sizeSliderEl) sizeSliderEl.value = newSize;

          // B. Calcular PUNTO MEDIO (Posición)
          let midX = (p1.x + p2.x) / 2;
          let midY = (p1.y + p2.y) / 2;

          // C. Mapear coordenadas al Canvas
          let x = map(midX, 0, video.width, -width/2, width/2);
          let y = map(midY, 0, video.height, -height/2, height/2);
          x *= -1; // Espejo

          // D. Dibujar la figura en el CENTRO
          drawFigure(x, y, 0);
          
          gestureActive = true; 
      }
  }

  // 2. Dibujo Estándar (Solo si NO está activo el gesto central)
  if (!gestureActive && hands.length > 0) {
    let handsToDraw = isDualMode ? hands.length : 1;

    for (let i = 0; i < handsToDraw; i++) {
        let hand = hands[i];
        if (hand.keypoints && hand.keypoints[9]) {
            let handX = hand.keypoints[9].x;
            let handY = hand.keypoints[9].y;
            
            let x = map(handX, 0, video.width, -width / 2, width / 2);
            let y = map(handY, 0, video.height, -height / 2, height / 2);
            x = x * -1; 

            drawFigure(x, y, 0);
        }
    }
  }
}

function drawFigure(x, y, z) {
  let colorEl = document.getElementById("colorPicker");
  let sizeEl = document.getElementById("sizeSlider");
  let rotEl = document.getElementById("rotationSlider");
  let pulseEl = document.getElementById("pulseMode");

  let colorValue = colorEl ? colorEl.value : "#00ff00";
  let baseSize = sizeEl ? parseInt(sizeEl.value) : 50;
  let rotSpeed = rotEl ? parseInt(rotEl.value) : 5;
  let isPulseMode = pulseEl ? pulseEl.checked : false;

  let finalSize = baseSize;
  if (isPulseMode) {
      finalSize = baseSize + (Math.sin(frameCount * 0.1) * (baseSize * 0.3));
  }

  push();
  translate(x, y, z);
  let speedFactor = rotSpeed * 0.01;
  rotateX(frameCount * speedFactor);
  rotateY(frameCount * speedFactor);
  
  fill(colorValue);
  noStroke(); 
  ambientLight(150);
  pointLight(255, 255, 255, 0, 0, 100);

  switch (figureName) {
    case "Cuadrado": plane(finalSize); break;
    case "Cubo": box(finalSize); break;
    case "Cilindro": cylinder(finalSize / 2, finalSize); break;
    case "Cono": cone(finalSize / 2, finalSize); break;
    case "Toro": torus(finalSize / 2, finalSize / 4); break;
    case "Esfera": sphere(finalSize / 1.5); break;
    case "None": break;
  }
  pop();
}

function setupUI() {
    const menuBtn = document.getElementById("menuToggle");
    const uiContainer = document.getElementById("ui-container");
    if(menuBtn && uiContainer){
        menuBtn.addEventListener("click", () => uiContainer.classList.toggle("hidden"));
    }
    document.querySelectorAll(".figureButton").forEach((button) => {
        button.addEventListener("click", (event) => {
            figureName = event.target.getAttribute("data-id");
            document.querySelectorAll(".figureButton").forEach(b => b.classList.remove("active"));
            event.target.classList.add("active");
        });
    });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}