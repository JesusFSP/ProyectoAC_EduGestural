// Variables globales
let handPose;
let video;
let hands = [];
let figureName = "Cubo"; 

// Texturas
let textures = {};
let useTexture = false;

// Variables del Juego (Quiz)
let quizActive = false;
let currentTarget = "";
let score = 0;
let quizTimer = 0;
let feedbackTimer = 0;
const FIGURES = ["Cubo", "Esfera", "Cono", "Cilindro", "Toro"];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");

  // Crear Texturas Procedurales (En memoria, sin cargar archivos)
  createTextures();

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  console.log("Cargando modelo HandPose 1.0...");
  
  let options = { flipped: false, maxHands: 2 };
  handPose = ml5.handPose(options, modelReady);
  
  setupUI();
}

// Función auxiliar para crear texturas visuales
function createTextures() {
    // 1. Textura Madera (Cajas)
    let wood = createGraphics(200, 200);
    wood.background(139, 69, 19); // Marrón
    wood.stroke(160, 82, 45);
    wood.strokeWeight(2);
    for(let i=0; i<20; i++) wood.line(0, i*10, 200, i*10 + random(-5,5)); // Vetas
    textures["Cubo"] = wood;
    textures["Cuadrado"] = wood;

    // 2. Textura Planeta (Esferas)
    let planet = createGraphics(200, 200);
    planet.background(0, 102, 204); // Azul Océano
    planet.noStroke();
    planet.fill(34, 139, 34); // Verde Tierra
    for(let i=0; i<10; i++) planet.ellipse(random(200), random(200), random(30,80));
    textures["Esfera"] = planet;

    // 3. Textura Ladrillo (Cilindros/Conos)
    let brick = createGraphics(200, 200);
    brick.background(178, 34, 34); // Rojo Ladrillo
    brick.stroke(200); // Cemento
    for(let y=0; y<200; y+=20) {
        for(let x=0; x<200; x+=40) {
            brick.rect(x + (y%40==0?0:20), y, 40, 20);
        }
    }
    textures["Cilindro"] = brick;
    textures["Cono"] = brick;
    textures["Toro"] = brick;
}

function modelReady() {
  console.log("Modelo listo.");
  const loadingScreen = document.getElementById("loading-model-message-container");
  if(loadingScreen) loadingScreen.style.display = "none";

  setTimeout(() => {
      if(handPose) handPose.detectStart(video, gotHands);
  }, 500);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 1. Fondo
  push();
  translate(-width / 2, -height / 2);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height); 
  pop();

  // Lógica del Quiz
  updateQuiz();

  // Variables UI
  let dualModeEl = document.getElementById("dualMode");
  let gestureSizeEl = document.getElementById("gestureSize");
  let sizeSliderEl = document.getElementById("sizeSlider");

  let isDualMode = dualModeEl ? dualModeEl.checked : true;
  let isGestureSize = gestureSizeEl ? gestureSizeEl.checked : false;
  let gestureActive = false;

  // --- GESTO DE ESTIRAR ---
  if (isGestureSize && hands.length >= 2) {
      let p1 = hands[0].keypoints[9];
      let p2 = hands[1].keypoints[9];
      if (p1 && p2) {
          let distance = dist(p1.x, p1.y, p2.x, p2.y);
          let newSize = map(distance, 50, 400, 20, 300);
          if (sizeSliderEl) sizeSliderEl.value = constrain(newSize, 20, 300);

          let midX = (p1.x + p2.x) / 2;
          let midY = (p1.y + p2.y) / 2;
          let x = map(midX, 0, video.width, -width/2, width/2) * -1;
          let y = map(midY, 0, video.height, -height/2, height/2);

          drawFigure(x, y, 0);
          gestureActive = true; 
      }
  }

  // --- DIBUJO ESTÁNDAR ---
  if (!gestureActive && hands.length > 0) {
    let handsToDraw = isDualMode ? hands.length : 1;
    for (let i = 0; i < handsToDraw; i++) {
        let hand = hands[i];
        if (hand.keypoints && hand.keypoints[9]) {
            let x = map(hand.keypoints[9].x, 0, video.width, -width/2, width/2) * -1;
            let y = map(hand.keypoints[9].y, 0, video.height, -height/2, height/2);
            drawFigure(x, y, 0);
        }
    }
  }
}

function drawFigure(x, y, z) {
  let sizeEl = document.getElementById("sizeSlider");
  let rotEl = document.getElementById("rotationSlider");
  let colorEl = document.getElementById("colorPicker");

  let baseSize = sizeEl ? parseInt(sizeEl.value) : 50;
  let rotSpeed = rotEl ? parseInt(rotEl.value) : 5;
  let colorValue = colorEl ? colorEl.value : "#00ff00";

  push();
  translate(x, y, z);
  rotateX(frameCount * rotSpeed * 0.01);
  rotateY(frameCount * rotSpeed * 0.01);
  
  noStroke(); 

  // --- LÓGICA DE TEXTURAS ---
  if (useTexture && textures[figureName]) {
      texture(textures[figureName]); // Aplicar textura real
  } else {
      fill(colorValue); // Usar color plano
      ambientLight(150);
      pointLight(255, 255, 255, 0, 0, 100);
  }

  switch (figureName) {
    case "Cuadrado": plane(baseSize); break;
    case "Cubo": box(baseSize); break;
    case "Cilindro": cylinder(baseSize / 2, baseSize); break;
    case "Cono": cone(baseSize / 2, baseSize); break;
    case "Toro": torus(baseSize / 2, baseSize / 4); break;
    case "Esfera": sphere(baseSize / 1.5); break;
    case "None": break;
  }
  pop();
}

// --- LÓGICA DEL JUEGO (STEAM) ---
function startQuiz() {
    quizActive = true;
    score = 0;
    document.getElementById("quiz-panel").classList.remove("hidden");
    document.getElementById("quiz-score").innerText = "Puntos: 0";
    nextQuestion();
}

function nextQuestion() {
    // Elegir una figura al azar
    currentTarget = FIGURES[Math.floor(Math.random() * FIGURES.length)];
    document.getElementById("quiz-question").innerText = `¡Invoca un: ${currentTarget.toUpperCase()}!`;
    document.getElementById("quiz-feedback").innerText = "";
    document.getElementById("quiz-feedback").style.color = "white";
}

function updateQuiz() {
    if (!quizActive) return;

    // Verificar si el usuario tiene la figura correcta seleccionada Y manos detectadas
    if (hands.length > 0 && figureName === currentTarget) {
        // Debounce simple para no sumar puntos 60 veces por segundo
        if (millis() - feedbackTimer > 2000) {
            score += 10;
            document.getElementById("quiz-score").innerText = "Puntos: " + score;
            document.getElementById("quiz-feedback").innerText = "¡EXCELENTE! 🎉";
            document.getElementById("quiz-feedback").style.color = "#00ff00";
            feedbackTimer = millis();
            
            // Siguiente pregunta en 1.5 segundos
            setTimeout(nextQuestion, 1500);
        }
    }
}

function setupUI() {
    const menuBtn = document.getElementById("menuToggle");
    const uiContainer = document.getElementById("ui-container");
    if(menuBtn) menuBtn.addEventListener("click", () => uiContainer.classList.toggle("hidden"));

    // Selección de figuras
    document.querySelectorAll(".figureButton").forEach((button) => {
        button.addEventListener("click", (event) => {
            figureName = event.target.getAttribute("data-id");
            document.querySelectorAll(".figureButton").forEach(b => b.classList.remove("active"));
            event.target.classList.add("active");
        });
    });

    // Toggle Texturas
    document.getElementById("modeColor").addEventListener("click", () => {
        useTexture = false;
        document.getElementById("modeColor").classList.add("active");
        document.getElementById("modeTexture").classList.remove("active");
    });
    document.getElementById("modeTexture").addEventListener("click", () => {
        useTexture = true;
        document.getElementById("modeTexture").classList.add("active");
        document.getElementById("modeColor").classList.remove("active");
    });

    // Iniciar Juego
    document.getElementById("startQuizBtn").addEventListener("click", startQuiz);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}