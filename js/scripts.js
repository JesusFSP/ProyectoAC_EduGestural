// --- VARIABLES GLOBALES ---
let handPose, video, hands = [];
let figureName = "Cubo"; 
let paintLayer;

// --- LÍMITES DE PANTALLA ---
let minX, maxX, minY, maxY; 
let boundaryDepth = 400;

// Texturas
let textures = {};
let useTexture = false;

// Estado del Juego
let gameMode = "NONE";
let score = 0;
const FIGURES = ["Cubo", "Esfera", "Cono", "Cilindro", "Dona"];

// QUIZ
let quizTarget = "";
let currentQuestionAnswered = false;

// SCULPT
let targetSize = 0;
let sculptTargetFigure = "Cubo"; 
let ghostX = 0; 
let ghostY = 0; 
let sculptTolerance = 15;
let sculptTimer = 0;

// AUDIO CONTEXT (Sonidos Sintetizados)
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");

  paintLayer = createGraphics(windowWidth, windowHeight);
  paintLayer.clear();

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
  push();
  translate(-width / 2, -height / 2); // Mover el origen al centro
  translate(width, 0);
  scale(-1, 1); // Efecto ESPEJO (invertir eje X)
  image(video, 0, 0, width, height); // Dibujar el video de la cámara
  if (gameMode === "PAINT") image(paintLayer, 0, 0, width, height); // Superponer el dibujo si estamos pintando
  pop();

  switch (gameMode) {
      case "QUIZ": updateQuizGame(); break;
      case "SCULPT": updateSculptGame(); break;
      case "PAINT": updatePaintGame(); break;
  }

  // INTERACCIÓN
  let dualModeEl = document.getElementById("dualMode");
  let gestureSizeEl = document.getElementById("gestureSize");
  let sizeSliderEl = document.getElementById("sizeSlider");
  let isDualMode = dualModeEl ? dualModeEl.checked : true;
  let isGestureSize = gestureSizeEl ? gestureSizeEl.checked : false;
  let gestureActive = false;
  let currentSize = sizeSliderEl ? parseInt(sizeSliderEl.value) : 50;
  let padding = currentSize / 2; 

  if (isGestureSize && hands.length >= 2) {
      let p1 = hands[0].keypoints[9];
      let p2 = hands[1].keypoints[9];
      if (p1 && p2) {
          let distance = dist(p1.x, p1.y, p2.x, p2.y);
          let newSize = map(distance, 50, 400, 20, 300); //Usamos map() para convertir esa distancia en píxeles
          newSize = constrain(newSize, 20, 300);
          if (sizeSliderEl) sizeSliderEl.value = newSize;

          let midX = (p1.x + p2.x) / 2;
          let midY = (p1.y + p2.y) / 2;
          let boundaryW = maxX - minX;
          let boundaryH = maxY - minY;
          let x = map(midX, 0, video.width, -boundaryW/2, boundaryW/2) * -1;
          let y = map(midY, 0, video.height, -boundaryH/2, boundaryH/2);
          
          x = constrain(x, minX + padding, maxX - padding);
          y = constrain(y, minY + padding, maxY - padding);

          drawFigure(x, y, 0);
          gestureActive = true; 
      }
  }

  if (!gestureActive && hands.length > 0) {
    let handsToDraw = isDualMode ? hands.length : 1;
    for (let i = 0; i < handsToDraw; i++) {
        let hand = hands[i];
        if (hand.keypoints && hand.keypoints[9]) {
            let x = map(hand.keypoints[9].x, 0, video.width, -width/2, width/2) * -1;
            let y = map(hand.keypoints[9].y, 0, video.height, -height/2, height/2);
            x = constrain(x, minX + padding, maxX - padding);
            y = constrain(y, minY + padding, maxY - padding);
            drawFigure(x, y, 0);
        }
    }
  }
}

// --- JUEGOS ---

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
        
        playSound("success"); // SONIDO DE ÉXITO

        document.getElementById("hud-score").innerText = "Puntos: " + score;
        document.getElementById("hud-feedback").innerText = "¡CORRECTO! 🎉";
        document.getElementById("hud-feedback").style.color = "#00ff00";
        setTimeout(nextQuizQuestion, 1500);
    }
}

function startSculpt() {
    score = 0;
    document.getElementById("sizeSlider").value = 50; 
    updateHUD("📐 Escultor", "Aciertos: 0", "Iguala Forma y Tamaño");
    nextSculptTarget();
}

function nextSculptTarget() {
    targetSize = random(40, 160);
    sculptTargetFigure = FIGURES[Math.floor(Math.random() * FIGURES.length)];
    
    let margin = targetSize / 2 + 10; 
    ghostX = random(minX + margin, maxX - margin);
    ghostY = random(minY + margin, maxY - margin);
    
    sculptTimer = 0;
    document.getElementById("hud-feedback").innerText = `¡Crea un ${sculptTargetFigure.toUpperCase()}!`;
    document.getElementById("hud-feedback").style.color = "white";
}

function updateSculptGame() {
    push();
    translate(ghostX, ghostY, 0); 
    noFill();
    stroke(255, 215, 0);
    strokeWeight(1);
    rotateX(frameCount * 0.01);
    rotateY(frameCount * 0.01);
    drawGhostFigure(sculptTargetFigure, targetSize);
    pop();

    let currentSize = parseInt(document.getElementById("sizeSlider").value);
    let sizeMatch = Math.abs(currentSize - targetSize) < sculptTolerance;
    let shapeMatch = figureName === sculptTargetFigure;

    if (shapeMatch && sizeMatch) {
        sculptTimer++;
        document.getElementById("hud-feedback").innerText = "¡Manténlo! " + Math.floor(sculptTimer/6) + "%";
        document.getElementById("hud-feedback").style.color = "yellow";

        if (sculptTimer > 60) { 
            score++;
            playSound("levelup"); // SONIDO DE NIVEL
            document.getElementById("hud-score").innerText = "Aciertos: " + score;
            document.getElementById("hud-feedback").innerText = "¡EXCELENTE! ✅";
            document.getElementById("hud-feedback").style.color = "#00ff00";
            
            document.getElementById("sizeSlider").value = 30; 
            nextSculptTarget(); 
        }
    } else if (!shapeMatch) {
        sculptTimer = 0;
        document.getElementById("hud-feedback").innerText = "Figura Incorrecta ❌";
        document.getElementById("hud-feedback").style.color = "red";
    } else {
        sculptTimer = 0;
        document.getElementById("hud-feedback").innerText = currentSize < targetSize ? "¡Más Grande!" : "¡Más Pequeño!";
        document.getElementById("hud-feedback").style.color = "cyan";
    }
}

function drawGhostFigure(figName, size) {
    switch(figName) {
        case "Cubo": box(size); break;
        case "Esfera": sphere(size/1.5); break;
        case "Cono": cone(size/2, size); break;
        case "Cilindro": cylinder(size/2, size); break;
        case "Dona": torus(size/2, size/4); break;
        case "Cuadrado": plane(size); break;
    }
}

function startPaint() {
    paintLayer.clear();
    updateHUD("🎨 Pintor Aéreo", "", "Dibuja en el espacio libre");
}

function updatePaintGame() {
    if (hands.length > 0) {
        let hand = hands[0];
        if (hand.keypoints && hand.keypoints[8]) { 
            let x = map(hand.keypoints[8].x, 0, video.width, 0, width); 
            let y = map(hand.keypoints[8].y, 0, video.height, 0, height);
            let size = parseInt(document.getElementById("sizeSlider").value) / 2;
            let limitLeft = (width/2) + minX;
            let limitRight = (width/2) + maxX;
            let limitTop = (height/2) + minY;
            let limitBottom = (height/2) + maxY;

            x = constrain(x, limitLeft + size, limitRight - size);
            y = constrain(y, limitTop + size, limitBottom - size);

            let color = document.getElementById("colorPicker").value;
            paintLayer.noStroke();
            paintLayer.fill(color);
            paintLayer.ellipse(x, y, size*2, size*2);
        }
    }
}

// --- UTILIDADES ---

// SISTEMA DE SONIDO SINTETIZADO (Sin archivos externos)
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === "success") {
        // Sonido agudo y alegre (Ding!)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } 
    else if (type === "levelup") {
        // Sonido de power-up (Tu-ru-ru!)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    }
}

function calculateBoundaries() {
    let sideMargin = 260; 
    let topMargin = 20;     
    let bottomMargin = 160; 

    let wAvailable = width - (sideMargin * 2);
    if (wAvailable < 300) wAvailable = width * 0.9;
    
    minX = -wAvailable / 2;
    maxX = wAvailable / 2;
    minY = (-height / 2) + topMargin;    
    maxY = (height / 2) - bottomMargin;   
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
    case "Dona": torus(baseSize / 2, baseSize / 4); break;
    case "Esfera": sphere(baseSize / 1.5); break;
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
    textures["Cilindro"] = brick; textures["Cono"] = brick; textures["Dona"] = brick; 
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
    
    // CAPTURA DE PANTALLA
    document.getElementById("screenshotBtn").addEventListener("click", () => {
        saveCanvas('mi_arte_ar', 'png');
        playSound("success"); // Feedback de sonido al tomar foto
    });

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
  calculateBoundaries();
}