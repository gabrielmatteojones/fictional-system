const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.getElementById('playerScore');
const aiScoreElem = document.getElementById('aiScore');
const centerMsg = document.getElementById('centerMsg');

// Game constants
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 110;
const PADDLE_RADIUS = 12;
const BALL_SIZE = 22;
const PLAYER_X = 36;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const PADDLE_SPEED = 9;
const BALL_SPEED = 7.8;
const BALL_SPEED_MAX = 13;
const BALL_ACCEL = 0.17;
const WIN_SCORE = 7;

// State
let playerY, aiY, ballX, ballY, ballVX, ballVY;
let playerScore = 0, aiScore = 0;
let running = false;
let roundOver = false;
let waitTimeout = null;

// Utility
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Responsive resize
function resizeCanvas() {
    // Keep 5:3 aspect ratio
    let w = window.innerWidth * 0.99;
    let h = w * 3/5;
    if (w > 900) w = 900, h = 540;
    if (h > window.innerHeight * 0.85) {
        h = window.innerHeight * 0.85;
        w = h * 5/3;
    }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game Reset & Start
function resetPositions(servingToLeft = Math.random() < 0.5) {
    playerY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiY = (canvas.height - PADDLE_HEIGHT) / 2;
    ballX = (canvas.width - BALL_SIZE) / 2;
    ballY = (canvas.height - BALL_SIZE) / 2;
    let angle = (Math.random() * Math.PI / 2 - Math.PI/4) * (Math.random()<0.5?1:-1);
    let speed = BALL_SPEED + Math.random()*1.6;
    ballVX = (servingToLeft ? -1 : 1) * (speed);
    ballVY = Math.sin(angle) * speed;
}
function resetGame() {
    playerScore = 0;
    aiScore = 0;
    updateScore();
    roundOver = false;
    running = false;
    showCenterMsg("CLICCA PER GIOCARE!");
    resetPositions();
}
function startRound() {
    running = true;
    roundOver = false;
    hideCenterMsg();
    resetPositions(Math.random()<0.5);
}

// Mouse control
canvas.addEventListener('mousemove', e => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = clamp(mouseY - PADDLE_HEIGHT/2, 0, canvas.height - PADDLE_HEIGHT);
});

// Click to start
canvas.addEventListener('mousedown', () => {
    if (!running) {
        startRound();
    }
});

// Draw Functions
function drawPaddle(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = "#2ee";
    ctx.shadowBlur = 18;
    // Rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x+PADDLE_RADIUS, y);
    ctx.lineTo(x+PADDLE_WIDTH-PADDLE_RADIUS, y);
    ctx.quadraticCurveTo(x+PADDLE_WIDTH, y, x+PADDLE_WIDTH, y+PADDLE_RADIUS);
    ctx.lineTo(x+PADDLE_WIDTH, y+PADDLE_HEIGHT-PADDLE_RADIUS);
    ctx.quadraticCurveTo(x+PADDLE_WIDTH, y+PADDLE_HEIGHT, x+PADDLE_WIDTH-PADDLE_RADIUS, y+PADDLE_HEIGHT);
    ctx.lineTo(x+PADDLE_RADIUS, y+PADDLE_HEIGHT);
    ctx.quadraticCurveTo(x, y+PADDLE_HEIGHT, x, y+PADDLE_HEIGHT-PADDLE_RADIUS);
    ctx.lineTo(x, y+PADDLE_RADIUS);
    ctx.quadraticCurveTo(x, y, x+PADDLE_RADIUS, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawBall(x, y, size, color) {
    ctx.save();
    ctx.shadowColor = "#20eeb9aa";
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // Glossy effect
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(x + size/2 - 3, y + size/2 - 4, size/3, Math.PI*1.2, Math.PI*1.7, false);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
}

function drawNet() {
    ctx.save();
    ctx.strokeStyle = '#2ee';
    ctx.setLineDash([13, 28]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.restore();
}

function showCenterMsg(msg) {
    centerMsg.textContent = msg;
    centerMsg.style.opacity = 1;
}
function hideCenterMsg() {
    centerMsg.style.opacity = 0;
}

// Score
function updateScore() {
    playerScoreElem.textContent = playerScore;
    aiScoreElem.textContent = aiScore;
}

// Sound (uncomment to enable)
// function playBeep(freq=440, time=0.08) {
//     try {
//         const ac = new(window.AudioContext||window.webkitAudioContext)();
//         const o = ac.createOscillator();
//         o.frequency.setValueAtTime(freq, ac.currentTime);
//         o.type = "square";
//         o.connect(ac.destination);
//         o.start();
//         o.stop(ac.currentTime + time);
//     } catch(e){}
// }

// AI
function updateAI() {
    // Predict ball destination with inertia
    let aiCenter = aiY + PADDLE_HEIGHT/2;
    let ballCenter = ballY + BALL_SIZE/2;
    if (ballVX > 0 && ballX > canvas.width/2 - 40) {
        // Predict landing point with bounce
        let predY = ballY, predVy = ballVY, predX = ballX;
        let steps = 0;
        while (predX < AI_X - BALL_SIZE && steps++ < 150) {
            predX += ballVX * 0.6;
            predY += predVy * 0.6;
            if (predY <= 0 || predY + BALL_SIZE >= canvas.height) predVy *= -1;
        }
        ballCenter = predY + BALL_SIZE/2;
    }
    let diff = ballCenter - aiCenter;
    // AI difficulty: smooth and a bit imperfect
    if (Math.abs(diff) > 16) {
        aiY += Math.sign(diff) * clamp(PADDLE_SPEED * 0.85, 0, Math.abs(diff));
    }
    // Clamp
    aiY = clamp(aiY, 0, canvas.height - PADDLE_HEIGHT);
}

// Ball Movement & Physics
function updateBall() {
    ballX += ballVX;
    ballY += ballVY;

    // Top/Bottom collision
    if (ballY <= 0) {
        ballY = 0;
        ballVY *= -1.04;
        // playBeep(240,0.05);
    }
    if (ballY + BALL_SIZE >= canvas.height) {
        ballY = canvas.height - BALL_SIZE;
        ballVY *= -1.04;
        // playBeep(240,0.05);
    }

    // Left paddle collision
    if (
        ballX <= PLAYER_X + PADDLE_WIDTH &&
        ballX + BALL_SIZE >= PLAYER_X &&
        ballY + BALL_SIZE > playerY &&
        ballY < playerY + PADDLE_HEIGHT
    ) {
        ballX = PLAYER_X + PADDLE_WIDTH;
        ballVX = Math.abs(ballVX) + BALL_ACCEL;
        if (ballVX > BALL_SPEED_MAX) ballVX = BALL_SPEED_MAX;
        ballVX *= 1;
        ballVY += ((ballY + BALL_SIZE/2) - (playerY + PADDLE_HEIGHT/2)) * 0.22;
        // playBeep(400,0.07);
        // Small "spin"
        if (Math.abs(ballVY) < 1.2) ballVY += (Math.random()-0.5)*2;
        if (Math.abs(ballVX) < 2.5) ballVX = 3 * Math.sign(ballVX);
    }

    // Right paddle collision
    if (
        ballX + BALL_SIZE >= AI_X &&
        ballX <= AI_X + PADDLE_WIDTH &&
        ballY + BALL_SIZE > aiY &&
        ballY < aiY + PADDLE_HEIGHT
    ) {
        ballX = AI_X - BALL_SIZE;
        ballVX = -Math.abs(ballVX) - BALL_ACCEL;
        if (Math.abs(ballVX) > BALL_SPEED_MAX) ballVX = -BALL_SPEED_MAX;
        ballVY += ((ballY + BALL_SIZE/2) - (aiY + PADDLE_HEIGHT/2)) * 0.22;
        // playBeep(600,0.08);
        if (Math.abs(ballVY) < 1.2) ballVY += (Math.random()-0.5)*2;
        if (Math.abs(ballVX) < 2.5) ballVX = -3;
    }

    // Player scores
    if (ballX + BALL_SIZE < 0) {
        aiScore++;
        updateScore();
        roundOver = true;
        // playBeep(160,0.19);
        if (aiScore >= WIN_SCORE) {
            showCenterMsg("HAI PERSO!<br><span style='font-size:0.6em'>Clicca per riprovare</span>");
            running = false;
        } else {
            showCenterMsg("Punto all'AI!<br><span style='font-size:0.6em'>Clicca per continuare</span>");
        }
        waitForClickToContinue();
    }
    // AI scores
    else if (ballX > canvas.width) {
        playerScore++;
        updateScore();
        roundOver = true;
        // playBeep(880,0.19);
        if (playerScore >= WIN_SCORE) {
            showCenterMsg("HAI VINTO!<br><span style='font-size:0.6em'>Clicca per una nuova partita</span>");
            running = false;
        } else {
            showCenterMsg("Punto per te!<br><span style='font-size:0.6em'>Clicca per continuare</span>");
        }
        waitForClickToContinue();
    }
}

function waitForClickToContinue() {
    running = false;
    function next(ev) {
        if (waitTimeout) clearTimeout(waitTimeout);
        canvas.removeEventListener('mousedown', next);
        if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
            resetGame();
        } else {
            startRound();
        }
    }
    // Slight delay before allowing next click (so you don't skip accidentally)
    waitTimeout = setTimeout(() => {
        canvas.addEventListener('mousedown', next);
    }, 550);
}

// Rendering
function draw() {
    // Background gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glow
    ctx.save();
    let grd = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.height/6,
        canvas.width/2, canvas.height/2, canvas.height/1.4
    );
    grd.addColorStop(0, "#124f74cc");
    grd.addColorStop(1, "#131b2f00");
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Net
    drawNet();
    // Paddles
    drawPaddle(PLAYER_X, playerY, "#2ee");
    drawPaddle(AI_X, aiY, "#e22");
    // Ball
    drawBall(ballX, ballY, BALL_SIZE, "#fff");
}

function gameLoop() {
    if (running) {
        updateAI();
        updateBall();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
resetGame();
gameLoop();
