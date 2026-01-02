// Variables globales
let handPose;
let video;
let hands = [];
let figureName = "Cubo"; 

function setup() {
  // Crear lienzo adaptado a la ventana
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");

  // Configurar video
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  console.log("Cargando modelo HandPose 1.0...");
  
  // Opciones para ml5 1.0
  let options = {
    flipped: false, 
    maxHands: 2     // Detectar hasta 2 manos
  };

  // CORRECCIÓN IMPORTANTE:
  // Inicializamos el modelo, pero NO arrancamos la detección aquí todavía.
  // Esperamos a que 'modelReady' nos avise.
  handPose = ml5.handPose(options, modelReady);
  
  setupUI();
}

function modelReady() {
  console.log("Modelo listo! Iniciando detección...");
  
  // Ocultar pantalla de carga
  const loadingScreen = document.getElementById("loading-model-message-container");
  if(loadingScreen) {
      loadingScreen.style.display = "none";
  }

  // SOLUCIÓN DEL ERROR:
  // Arrancamos la detección AQUÍ, solo cuando el modelo ya existe.
  handPose.detectStart(video, gotHands);
}

// Callback que actualiza las manos detectadas
function gotHands(results) {
  // Guardamos los resultados en la variable global
  hands = results;
}

function draw() {
  // 1. Fondo de video (Espejo Manual)
  push();
  translate(-width / 2, -height / 2);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height); 
  pop();

  // Verificamos si el usuario quiere ver las dos manos
  let dualModeCheckbox = document.getElementById("dualMode");
  // Si existe el checkbox usamos su valor, si no, true por defecto
  let isDualMode = dualModeCheckbox ? dualModeCheckbox.checked : true;

  // 2. Lógica de Dibujo
  // Solo intentamos dibujar si hay manos detectadas
  if (hands.length > 0) {
    
    let handsToDraw = isDualMode ? hands.length : 1;

    for (let i = 0; i < handsToDraw; i++) {
        let hand = hands[i];
        
        // Verificamos que la mano tenga puntos clave (keypoints)
        if (hand.keypoints && hand.keypoints[9]) {
            // El punto 9 es el centro de la palma
            let handX = hand.keypoints[9].x;
            let handY = hand.keypoints[9].y;

            // Mapeo de coordenadas al tamaño del canvas
            let x = map(handX, 0, video.width, -width / 2, width / 2);
            let y = map(handY, 0, video.height, -height / 2, height / 2);
            
            // Invertir X porque el video está en modo espejo
            x = x * -1;

            drawFigure(x, y, 0);
        }
    }
  }
}

function drawFigure(x, y, z) {
  // Obtener valores de la UI con protección por si no existen aún
  let colorPicker = document.getElementById("colorPicker");
  let sizeSlider = document.getElementById("sizeSlider");
  let rotationSlider = document.getElementById("rotationSlider");
  let pulseCheckbox = document.getElementById("pulseMode");

  let colorValue = colorPicker ? colorPicker.value : "#00ff00";
  let baseSize = sizeSlider ? parseInt(sizeSlider.value) : 50;
  let rotSpeed = rotationSlider ? parseInt(rotationSlider.value) : 5;
  let isPulseMode = pulseCheckbox ? pulseCheckbox.checked : false;

  // Dinámica de Latido
  let finalSize = baseSize;
  if (isPulseMode) {
      finalSize = baseSize + (Math.sin(frameCount * 0.1) * (baseSize * 0.3));
  }

  push();
  translate(x, y, z);
  
  // Rotación
  let speedFactor = rotSpeed * 0.01;
  rotateX(frameCount * speedFactor);
  rotateY(frameCount * speedFactor);

  // Estilos
  fill(colorValue);
  noStroke(); 
  
  // Iluminación
  ambientLight(150);
  pointLight(255, 255, 255, 0, 0, 100);

  // Dibujar figura
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
        menuBtn.addEventListener("click", () => {
            uiContainer.classList.toggle("hidden");
        });
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