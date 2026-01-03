// --- VARIABLES GLOBALES ---
let handPose, video, hands = [];
let figureName = "Cubo"; 
let paintLayer;

// --- NUEVO LÍMITE: Variables para el cuadro delimitador ---
let boundaryW, boundaryH; // Ancho y alto del límite
let boundaryDepth = 400;  // Profundidad del límite

// Texturas
let textures = {};
let useTexture = false;

// Estado del Juego
let gameMode = "NONE";
let score = 0;
const FIGURES = ["Cubo", "Esfera", "Cono", "Cilindro", "Toro"];

// Variables específicas de juegos
// QUIZ
let quizTarget = "";
let currentQuestionAnswered = false;
let quizTimer = 0;

// SCULPT (Escultor)
let targetSize = 0;
let ghostX = 0; 
let ghostY = 0; 
let sculptTolerance = 15;
let sculptTimer = 0;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");

  paintLayer = createGraphics(windowWidth, windowHeight);
  paintLayer.clear();

  // Inicializar tamaño del límite
  calculateBoundaries();

  createTextures();

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  console.log("Cargando modelo HandPose 1.0...");
  let options = { flipped: false, maxHands: 2 };
  handPose = ml5.handPose(options, modelReady);
  
  setupUI();
}

function modelReady() {
  console.log("Modelo listo.");
  const loadingScreen = document.getElementById("loading-model-message-container");
  if(loadingScreen) loadingScreen.style.display = "none";
  setTimeout(() => { if(handPose) handPose.detectStart(video, gotHands); }, 500);
}

function gotHands(results) { hands = results; }

function draw() {
  // 1. DIBUJAR FONDO Y VIDEO
  push();
  translate(-width / 2, -height / 2);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height); 
  
  if (gameMode === "PAINT") {
      image(paintLayer, 0, 0, width, height);
  }
  pop();

  // --- NUEVO LÍMITE: Dibujar el cuadro amarillo ---
  push();
  noFill();
  stroke(255, 255, 0); // Color Amarillo
  strokeWeight(3);
  // Como estamos en WEBGL, el centro es (0,0,0). Dibujamos la caja alrededor.
  box(boundaryW, boundaryH, boundaryDepth);
  pop();
  // -------------------------------------------------

  // 2. LÓGICA DEL JUEGO ACTIVO
  switch (gameMode) {
      case "QUIZ": updateQuizGame(); break;
      case "SCULPT": updateSculptGame(); break;
      case "PAINT": updatePaintGame(); break;
  }

  // 3. LOGICA DE INTERACCIÓN
  let dualModeEl = document.getElementById("dualMode");
  let gestureSizeEl = document.getElementById("gestureSize");
  let sizeSliderEl = document.getElementById("sizeSlider");
  let isDualMode = dualModeEl ? dualModeEl.checked : true;
  let isGestureSize = gestureSizeEl ? gestureSizeEl.checked : false;
  let gestureActive = false;
  let currentSize = sizeSliderEl ? parseInt(sizeSliderEl.value) : 50;
  let padding = currentSize / 2; // Margen para que la figura no se salga a medias

  // --- GESTO DE ESTIRAR ---
  if (isGestureSize && hands.length >= 2) {
      let p1 = hands[0].keypoints[9];
      let p2 = hands[1].keypoints[9];
      if (p1 && p2) {
          let distance = dist(p1.x, p1.y, p2.x, p2.y);
          let newSize = map(distance, 50, 400, 20, 300);
          newSize = constrain(newSize, 20, 300);
          
          if (sizeSliderEl) sizeSliderEl.value = newSize;

          let midX = (p1.x + p2.x) / 2;
          let midY = (p1.y + p2.y) / 2;

          // --- NUEVO LÍMITE: Mapeo restringido al Boundary ---
          let halfBW = boundaryW / 2;
          let halfBH = boundaryH / 2;
          // Mapeamos al tamaño del boundary, no del ancho total
          let x = map(midX, 0, video.width, -halfBW, halfBW) * -1;
          let y = map(midY, 0, video.height, -halfBH, halfBH);
          
          // CONSTRAIN FINAL: Asegura que no se pase ni un pixel, considerando el tamaño de la figura
          x = constrain(x, -halfBW + padding, halfBW - padding);
          y = constrain(y, -halfBH + padding, halfBH - padding);
          // ---------------------------------------------------

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
            // --- NUEVO LÍMITE: Mapeo restringido individual ---
            let halfBW = boundaryW / 2;
            let halfBH = boundaryH / 2;
            let x = map(hand.keypoints[9].x, 0, video.width, -halfBW, halfBW) * -1;
            let y = map(hand.keypoints[9].y, 0, video.height, -halfBH, halfBH);
            
            // Constrain final con padding
            x = constrain(x, -halfBW + padding, halfBW - padding);
            y = constrain(y, -halfBH + padding, halfBH - padding);
            // ---------------------------------------------------

            drawFigure(x, y, 0);
        }
    }
  }
}

// --- LOGICA DE LOS JUEGOS ---

// JUEGO 1: QUIZ
function startQuiz() {
    score = 0;
    currentQuestionAnswered = false;
    updateHUD("🧠 Quiz Geométrico", "Puntos: 0", "¡Prepárate!");
    nextQuizQuestion();
}

function nextQuizQuestion() {
    quizTarget = FIGURES[Math.floor(Math.random() * FIGURES.length)];
    currentQuestionAnswered = false;
    document.getElementById("hud-feedback").innerText = `¡Invoca un: ${quizTarget.toUpperCase()}!`;
    document.getElementById("hud-feedback").style.color = "white";
}

function updateQuizGame() {
    if (currentQuestionAnswered) return;

    if (hands.length > 0 && figureName === quizTarget) {
        score += 10;
        currentQuestionAnswered = true;
        
        document.getElementById("hud-score").innerText = "Puntos: " + score;
        document.getElementById("hud-feedback").innerText = "¡CORRECTO! 🎉";
        document.getElementById("hud-feedback").style.color = "#00ff00";

        setTimeout(nextQuizQuestion, 1500);
    }
}

// JUEGO 2: ESCULTOR (Con límite)
function startSculpt() {
    score = 0;
    document.getElementById("sizeSlider").value = 50; 
    updateHUD("📐 Escultor", "Aciertos: 0", "Iguala el tamaño del fantasma");
    nextSculptTarget();
}

function nextSculptTarget() {
    targetSize = random(30, 180);
    
    // --- NUEVO LÍMITE: Posición aleatoria DENTRO del cuadro ---
    let margin = targetSize / 2 + 20; // Margen seguro
    ghostX = random(-boundaryW/2 + margin, boundaryW/2 - margin);
    ghostY = random(-boundaryH/2 + margin, boundaryH/2 - margin);
    // ----------------------------------------------------------
    
    sculptTimer = 0;
    document.getElementById("hud-feedback").innerText = "¡Busca y Ajusta!";
    document.getElementById("hud-feedback").style.color = "white";
}

function updateSculptGame() {
    push();
    translate(ghostX, ghostY, 0); 
    noFill();
    stroke(255, 215, 0);
    strokeWeight(2);
    rotateX(frameCount * 0.01);
    rotateY(frameCount * 0.01);
    
    if(figureName === "Cubo") box(targetSize);
    else if(figureName === "Esfera") sphere(targetSize/1.5);
    else sphere(targetSize/1.5); 
    pop();

    let currentSize = parseInt(document.getElementById("sizeSlider").value);
    
    if (Math.abs(currentSize - targetSize) < sculptTolerance) {
        sculptTimer++;
        document.getElementById("hud-feedback").innerText = "¡Manténlo! " + Math.floor(sculptTimer/10) + "%";
        document.getElementById("hud-feedback").style.color = "yellow";

        if (sculptTimer > 60) {
            score++;
            document.getElementById("hud-score").innerText = "Aciertos: " + score;
            document.getElementById("hud-feedback").innerText = "¡PERFECTO! ✅";
            document.getElementById("hud-feedback").style.color = "#00ff00";
            
            document.getElementById("sizeSlider").value = 20;
            
            nextSculptTarget(); 
        }
    } else {
        sculptTimer = 0; 
    }
}

// JUEGO 3: PINTOR (Con límite 2D)
function startPaint() {
    paintLayer.clear();
    // Dibujar también el límite en la capa de pintura para referencia
    paintLayer.push();
    paintLayer.noFill();
    paintLayer.stroke(255, 255, 0, 50); // Amarillo transparente
    paintLayer.strokeWeight(2);
    let marginX = (width - boundaryW) / 2;
    let marginY = (height - boundaryH) / 2;
    paintLayer.rect(marginX, marginY, boundaryW, boundaryH);
    paintLayer.pop();
    
    updateHUD("🎨 Pintor Aéreo", "", "Dibuja dentro del cuadro");
}

function updatePaintGame() {
    if (hands.length > 0) {
        let hand = hands[0];
        if (hand.keypoints && hand.keypoints[8]) { 
            // Mapeo normal espejo
            let x = map(hand.keypoints[8].x, 0, video.width, 0, width); 
            let y = map(hand.keypoints[8].y, 0, video.height, 0, height);
            
            // --- NUEVO LÍMITE: Restringir pintura al cuadro 2D ---
            // Calculamos los márgenes en 2D
            let marginX = (width - boundaryW) / 2;
            let marginY = (height - boundaryH) / 2;
            let size = parseInt(document.getElementById("sizeSlider").value) / 2;
            
            // Usamos constrain para que no pinte fuera
            x = constrain(x, marginX + size, width - marginX - size);
            y = constrain(y, marginY + size, height - marginY - size);
            // ----------------------------------------------------

            let color = document.getElementById("colorPicker").value;
            paintLayer.noStroke();
            paintLayer.fill(color);
            paintLayer.ellipse(x, y, size*2, size*2);
        }
    }
}

// --- UTILIDADES ---

// Función para calcular el tamaño del límite (80% de la pantalla)
function calculateBoundaries() {
    boundaryW = width * 0.8; // 80% del ancho
    boundaryH = height * 0.8; // 80% del alto
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

  if (useTexture && textures[figureName]) texture(textures[figureName]);
  else {
      fill(colorValue);
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

function createTextures() {
    let wood = createGraphics(200, 200);
    wood.background(139, 69, 19);
    wood.stroke(160, 82, 45);
    for(let i=0; i<20; i++) wood.line(0, i*10, 200, i*10 + random(-5,5));
    textures["Cubo"] = wood; textures["Cuadrado"] = wood;

    let planet = createGraphics(200, 200);
    planet.background(0, 102, 204);
    planet.noStroke(); planet.fill(34, 139, 34);
    for(let i=0; i<10; i++) planet.ellipse(random(200), random(200), random(30,80));
    textures["Esfera"] = planet;

    let brick = createGraphics(200, 200);
    brick.background(178, 34, 34); brick.stroke(200);
    for(let y=0; y<200; y+=20) for(let x=0; x<200; x+=40) brick.rect(x+(y%40==0?0:20), y, 40, 20);
    textures["Cilindro"] = brick; textures["Cono"] = brick; textures["Toro"] = brick;
}

function updateHUD(title, scoreText, feedback) {
    document.getElementById("hud-panel").classList.remove("hidden");
    document.getElementById("hud-title").innerText = title;
    
    let scoreEl = document.getElementById("hud-score");
    if(scoreText) { scoreEl.innerText = scoreText; scoreEl.classList.remove("hidden"); }
    else scoreEl.classList.add("hidden");

    document.getElementById("hud-feedback").innerText = feedback;
}

function setupUI() {
    document.getElementById("menuToggle").addEventListener("click", () => {
        document.getElementById("ui-container").classList.toggle("hidden");
    });
    document.getElementById("gamesToggle").addEventListener("click", () => {
        document.getElementById("games-container").classList.toggle("hidden");
    });

    const setGame = (mode, btnId) => {
        gameMode = mode;
        document.querySelectorAll(".game-btn").forEach(b => b.classList.remove("active"));
        document.getElementById(btnId).classList.add("active");
        
        if(mode === "QUIZ") startQuiz();
        else if(mode === "SCULPT") startSculpt();
        else if(mode === "PAINT") startPaint();
        else updateHUD("Modo Libre", "", "Explora las figuras");
    };

    document.getElementById("gameNone").addEventListener("click", () => setGame("NONE", "gameNone"));
    document.getElementById("gameQuiz").addEventListener("click", () => setGame("QUIZ", "gameQuiz"));
    document.getElementById("gameSculpt").addEventListener("click", () => setGame("SCULPT", "gameSculpt"));
    document.getElementById("gamePaint").addEventListener("click", () => setGame("PAINT", "gamePaint"));
    
    document.getElementById("clearPaintBtn").addEventListener("click", () => paintLayer.clear());

    document.querySelectorAll(".figureButton").forEach((button) => {
        button.addEventListener("click", (event) => {
            figureName = event.target.getAttribute("data-id");
            document.querySelectorAll(".figureButton").forEach(b => b.classList.remove("active"));
            event.target.classList.add("active");
        });
    });

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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  paintLayer = createGraphics(windowWidth, windowHeight);
  calculateBoundaries(); // Recalcular límites si cambia la ventana
}