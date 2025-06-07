const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 14;
const PLAYER_X = 20;
const AI_X = canvas.width - 20 - PADDLE_WIDTH;
const PADDLE_SPEED = 6;
const BALL_SPEED = 6;

// State
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = (canvas.width - BALL_SIZE) / 2;
let ballY = (canvas.height - BALL_SIZE) / 2;
let ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballVY = BALL_SPEED * (Math.random() * 2 - 1);

// Mouse control for left paddle
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;

    // Clamp within bounds
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function resetBall() {
    ballX = (canvas.width - BALL_SIZE) / 2;
    ballY = (canvas.height - BALL_SIZE) / 2;
    ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballVY = BALL_SPEED * (Math.random() * 2 - 1);
}

function updateAI() {
    // Simple AI: move towards the ball center
    const aiCenter = aiY + PADDLE_HEIGHT / 2;
    const ballCenter = ballY + BALL_SIZE / 2;
    if (aiCenter < ballCenter - 10) {
        aiY += PADDLE_SPEED;
    } else if (aiCenter > ballCenter + 10) {
        aiY -= PADDLE_SPEED;
    }
    // Clamp
    aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

function updateBall() {
    ballX += ballVX;
    ballY += ballVY;

    // Collision with top/bottom
    if (ballY <= 0) {
        ballY = 0;
        ballVY *= -1;
    }
    if (ballY + BALL_SIZE >= canvas.height) {
        ballY = canvas.height - BALL_SIZE;
        ballVY *= -1;
    }

    // Collision with player paddle
    if (
        ballX <= PLAYER_X + PADDLE_WIDTH &&
        ballX >= PLAYER_X &&
        ballY + BALL_SIZE >= playerY &&
        ballY <= playerY + PADDLE_HEIGHT
    ) {
        ballX = PLAYER_X + PADDLE_WIDTH;
        ballVX *= -1;

        // Add a bit of "english" based on where it hit
        const collidePoint = (ballY + BALL_SIZE / 2) - (playerY + PADDLE_HEIGHT / 2);
        ballVY = collidePoint * 0.2;
    }

    // Collision with AI paddle
    if (
        ballX + BALL_SIZE >= AI_X &&
        ballX + BALL_SIZE <= AI_X + PADDLE_WIDTH &&
        ballY + BALL_SIZE >= aiY &&
        ballY <= aiY + PADDLE_HEIGHT
    ) {
        ballX = AI_X - BALL_SIZE;
        ballVX *= -1;

        const collidePoint = (ballY + BALL_SIZE / 2) - (aiY + PADDLE_HEIGHT / 2);
        ballVY = collidePoint * 0.2;
    }

    // Ball out of bounds (score)
    if (ballX < 0 || ballX > canvas.width) {
        resetBall();
    }
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Net
    ctx.save();
    ctx.strokeStyle = '#fff2';
    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += 30) {
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 20);
    }
    ctx.stroke();
    ctx.restore();

    // Paddles
    drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, '#fff');
    drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, '#fff');

    // Ball
    drawBall(ballX, ballY, BALL_SIZE, '#fff');
}

function gameLoop() {
    updateAI();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

resetBall();
gameLoop();
