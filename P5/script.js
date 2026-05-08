const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'MENU', gameMode = 3, scores = { player: 0, bot: 0 }, countdown = 0;
let lastScorer = ""; 
let stuckTimer = 0; // Para detectar si la bola no se mueve

const keys = {};
window.addEventListener('keydown', e => { 
    keys[e.code] = true; 
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault(); 
});
window.addEventListener('keyup', e => keys[e.code] = false);

const ball = { x: 400, y: 250, vx: 0, vy: 0, radius: 10, friction: 0.97, reset() { this.x = 400; this.y = 250; this.vx = 0; this.vy = 0; } };

const teamA = [
    { id: 'p1', x: 150, y: 250, radius: 18, speed: 3.5, angle: 0, color: '#2a52be', role: 'player' },
    { id: 'p2', x: 80, y: 250, radius: 18, speed: 2.8, color: '#00d2ff', role: 'mate' }
];
const teamB = [
    { id: 'b1', x: 650, y: 250, radius: 18, speed: 2.5, color: '#b22222', role: 'bot' },
    { id: 'b2', x: 720, y: 250, radius: 18, speed: 2.2, color: '#800000', role: 'bot' }
];
const allPlayers = [...teamA, ...teamB];

function resolvePhysics() {
    allPlayers.forEach(p => {
        let dx = ball.x - p.x, dy = ball.y - p.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < p.radius + ball.radius) {
            let angle = Math.atan2(dy, dx);
            ball.x = p.x + Math.cos(angle) * (p.radius + ball.radius + 1);
            ball.y = p.y + Math.sin(angle) * (p.radius + ball.radius + 1);
            ball.vx = Math.cos(angle) * 5; ball.vy = Math.sin(angle) * 5;
            stuckTimer = 0; // Si alguien la toca, ya no está atascada
        }
    });
    for(let i=0; i<allPlayers.length; i++) {
        for(let j=i+1; j<allPlayers.length; j++) {
            let p1 = allPlayers[i], p2 = allPlayers[j], dx = p2.x-p1.x, dy = p2.y-p1.y, dist = Math.sqrt(dx*dx+dy*dy);
            if(dist < p1.radius+p2.radius) {
                let angle = Math.atan2(dy, dx), overlap = (p1.radius+p2.radius) - dist;
                p1.x -= Math.cos(angle) * overlap/2; p1.y -= Math.sin(angle) * overlap/2;
                p2.x += Math.cos(angle) * overlap/2; p2.y += Math.sin(angle) * overlap/2;
            }
        }
    }
}

function updateAI(p, isMate) {
    let targetX, targetY;
    if (isMate) {
        let playerDist = Math.sqrt((teamA[0].x - ball.x)**2 + (teamA[0].y - ball.y)**2);
        if (playerDist < 130) { targetX = 120; targetY = ball.y; } 
        else { targetX = ball.x; targetY = ball.y; }
    } else {
        if (p.id === 'b1') { targetX = ball.x + 15; targetY = ball.y; } 
        else { targetX = 700; targetY = ball.y; }
    }
    let distToTarget = Math.sqrt((p.x - targetX)**2 + (p.y - targetY)**2);
    let activeSpeed = (distToTarget < 30) ? p.speed * 0.4 : p.speed;
    if (Math.abs(p.x - targetX) > 3) p.x += (p.x < targetX) ? activeSpeed : -activeSpeed;
    if (Math.abs(p.y - targetY) > 3) p.y += (p.y < targetY) ? activeSpeed : -activeSpeed;
}

function update() {
    if (gameState === 'MENU') {
        if (keys['Digit1'] || keys['Numpad1']) { gameMode = 3; resetMatch(); }
        if (keys['Digit2'] || keys['Numpad2']) { gameMode = 1; resetMatch(); }
        return;
    }
    if (gameState !== 'PLAYING') return;

    let p = teamA[0];
    if (keys['ArrowUp']) p.y -= p.speed; if (keys['ArrowDown']) p.y += p.speed;
    if (keys['ArrowLeft']) p.x -= p.speed; if (keys['ArrowRight']) p.x += p.speed;
    if (keys['KeyA']) p.angle -= 0.1; if (keys['KeyD']) p.angle += 0.1;
    if (keys['Space'] && Math.sqrt((ball.x-p.x)**2 + (ball.y-p.y)**2) < 35) {
        ball.vx = Math.cos(p.angle)*12; ball.vy = Math.sin(p.angle)*12;
    }

    updateAI(teamA[1], true); updateAI(teamB[0], false); updateAI(teamB[1], false);
    
    ball.x += ball.vx; ball.y += ball.vy;
    ball.vx *= ball.friction; ball.vy *= ball.friction;

    // --- PARCHE ANTI-ATASCO ---
    // Si la bola casi no se mueve y está en una esquina, sumamos tiempo
    if (Math.abs(ball.vx) < 0.2 && Math.abs(ball.vy) < 0.2) {
        stuckTimer++;
        if (stuckTimer > 120) { // Aproximadamente 2 segundos
            ball.vx = (400 - ball.x) * 0.02; // Empujón suave al centro
            ball.vy = (250 - ball.y) * 0.02;
            stuckTimer = 0;
        }
    } else {
        stuckTimer = 0;
    }

    const r = ball.radius;
    if (ball.y < r) { ball.y = r; ball.vy *= -0.5; }
    if (ball.y > canvas.height - r) { ball.y = canvas.height - r; ball.vy *= -0.5; }

    const goalRange = (ball.y > 180 && ball.y < 320);
    if (ball.x < r) {
        if (goalRange) { scores.bot++; lastScorer = "RIVAL"; triggerGoalCelebration(); }
        else { ball.x = r; ball.vx *= -0.5; }
    }
    if (ball.x > canvas.width - r) {
        if (goalRange) { scores.player++; lastScorer = "PLAYER"; triggerGoalCelebration(); }
        else { ball.x = canvas.width - r; ball.vx *= -0.5; }
    }

    resolvePhysics();
    allPlayers.forEach(pl => { 
        pl.x = Math.max(pl.radius, Math.min(canvas.width - pl.radius, pl.x)); 
        pl.y = Math.max(pl.radius, Math.min(canvas.height - pl.radius, pl.y)); 
    });
}

function triggerGoalCelebration() {
    gameState = 'CELEBRATION';
    setTimeout(() => {
        if (scores.player >= gameMode || scores.bot >= gameMode) { gameState = 'END'; } 
        else { resetRound(); }
    }, 2000);
}

function resetMatch() { scores = { player: 0, bot: 0 }; resetRound(); }
function resetRound() {
    ball.reset(); 
    teamA[0].x=150; teamA[0].y=250; teamA[1].x=80; teamA[1].y=250;
    teamB[0].x=650; teamB[0].y=250; teamB[1].x=720; teamB[1].y=250;
    gameState = 'COUNTDOWN'; countdown = 3;
    let t = setInterval(() => { countdown--; if(countdown<=0) { clearInterval(t); gameState = 'PLAYING'; } }, 1000);
}

function draw() {
    ctx.clearRect(0,0,800,500);
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(400,0); ctx.lineTo(400,500); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, 250, 60, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = "#333"; ctx.fillRect(0, 180, 5, 140); ctx.fillRect(795, 180, 5, 140);

    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    allPlayers.forEach(p => {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
        if(p.role === 'player') {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle="white";
            ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(30,-6); ctx.lineTo(30,6); ctx.fill(); ctx.restore();
        }
    });

    ctx.textAlign = "center";
    if (gameState === 'MENU') {
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0,800,500);
        ctx.fillStyle = "#ff9800"; ctx.font = "bold 40px Arial"; ctx.fillText("BOT LEAGUE", 400, 200);
        ctx.fillStyle = "white"; ctx.font = "18px Arial"; ctx.fillText("1: 3 Goles | 2: Gol de Oro", 400, 260);
    } 
    else if (gameState === 'CELEBRATION') {
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0,0,800,500);
        ctx.fillStyle = lastScorer === "PLAYER" ? "#4CAF50" : "#F44336";
        ctx.font = "italic bold 80px Arial"; ctx.strokeStyle = "white"; ctx.lineWidth = 4;
        let msg = lastScorer === "PLAYER" ? "¡¡¡GOOOOOL!!!" : "¡GOL RIVAL!";
        ctx.strokeText(msg, 400, 260); ctx.fillText(msg, 400, 260);
    }
    else if (gameState === 'COUNTDOWN') {
        ctx.fillStyle = "white"; ctx.font = "bold 80px Arial"; ctx.fillText(countdown, 400, 270);
    } 
    else if (gameState === 'END') {
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0,800,500);
        ctx.fillStyle = "white"; ctx.font = "40px Arial";
        ctx.fillText(scores.player > scores.bot ? "¡VICTORIA FINAL!" : "DERROTA", 400, 250);
        ctx.font = "15px Arial"; ctx.fillText("F5 para reiniciar", 400, 310);
    } 
    else {
        ctx.font = "bold 40px Arial"; ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText(`${scores.player} - ${scores.bot}`, 400, 70);
    }
    update(); requestAnimationFrame(draw);
}
draw();