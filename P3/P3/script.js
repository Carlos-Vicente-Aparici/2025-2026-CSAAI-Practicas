

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

// Configuración del Canvas
canvas.width = 900;
canvas.height = 700;

// --- ESTADO DEL JUEGO ---
var Game = {
    score: 0,
    lives: 3,
    energy: 10,
    maxEnergy: 10,
    state: 'PLAYING', // 'PLAYING', 'VICTORY', 'GAMEOVER'
    fleetDirection: 1,
    fleetSpeed: 1,
    lastEnemyShootTime: 0,
    explosionFrames: 15
};

// --- RECURSOS (Imágenes) ---
var images = {
    player: new Image(),
    alien: new Image(),
    explosion: new Image()
};
images.player.src = 'assets/nave.png'; 
images.alien.src = 'assets/alien.png';
images.explosion.src = 'assets/explosion.png';

// --- ENTIDADES ---
var player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    w: 50,
    h: 40,
    speed: 6
};

var bullets = [];
var enemyBullets = [];
var aliens = [];
var activeExplosions = [];

// --- INICIALIZACIÓN ---
function initFleet() {
    var rows = 3;
    var cols = 8;
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            aliens.push({
                x: 150 + j * 70,
                y: 100 + i * 60,
                w: 45,
                h: 35,
                alive: true
            });
        }
    }
}

// --- LÓGICA DE ACTUALIZACIÓN ---
function update() {
    if (Game.state !== 'PLAYING') return;

    // Movimiento Jugador (Cambiado de corchetes a notación de punto para evitar avisos)
    if (keys.ArrowLeft && player.x > 10) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.w - 10) player.x += player.speed;

    // Actualizar Energía
    if (Game.energy < Game.maxEnergy) {
        Game.energy += 0.02;
    }

    // Movimiento Flota
    var remainingAliens = aliens.filter(function(a) { return a.alive; });
    if (remainingAliens.length === 0) {
        endGame('VICTORY');
        return;
    }

    var speedFactor = 1 + (24 - remainingAliens.length) * 0.15;
    var moveX = Game.fleetDirection * Game.fleetSpeed * speedFactor;

    var hitWall = false;
    aliens.forEach(function(alien) {
        if (!alien.alive) return;
        alien.x += moveX;
        if (alien.x > canvas.width - alien.w - 10 || alien.x < 10) hitWall = true;
    });

    if (hitWall) {
        Game.fleetDirection *= -1;
        aliens.forEach(function(a) { a.y += 10; });
    }

    // Disparo Enemigo
    var now = Date.now();
    if (now - Game.lastEnemyShootTime > 1000) {
        var shooter = remainingAliens[Math.floor(Math.random() * remainingAliens.length)];
        enemyBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, speed: 4 });
        Game.lastEnemyShootTime = now;
    }

    // Balas Jugador
    bullets.forEach(function(b, bi) {
        b.y -= 7;
        aliens.forEach(function(a) {
            if (a.alive && b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
                a.alive = false;
                bullets.splice(bi, 1);
                Game.score += 10;
                activeExplosions.push({ x: a.x, y: a.y, timer: Game.explosionFrames });
                document.getElementById('snd-explosion').play();
            }
        });
        if (b.y < 0) bullets.splice(bi, 1);
    });

    // Balas Enemigas
    enemyBullets.forEach(function(eb, ebi) {
        eb.y += 5;
        if (eb.x > player.x && eb.x < player.x + player.w && eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(ebi, 1);
            Game.lives--;
            if (Game.lives <= 0) endGame('GAMEOVER');
        }
        if (eb.y > canvas.height) enemyBullets.splice(ebi, 1);
    });

    activeExplosions.forEach(function(ex, i) {
        ex.timer--;
        if (ex.timer <= 0) activeExplosions.splice(i, 1);
    });
}

// --- LÓGICA DE DIBUJADO ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    // Evitamos template literals (backticks) para máxima compatibilidad
    ctx.fillText("Puntuación: " + Game.score, 20, 40);
    ctx.fillText("Vidas: " + Game.lives, canvas.width - 120, 40);
    
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 55, 100, 10);
    ctx.fillStyle = Game.energy < 2 ? "red" : "cyan";
    ctx.fillRect(20, 55, Game.energy * 10, 10);

    ctx.drawImage(images.player, player.x, player.y, player.w, player.h);

    aliens.forEach(function(a) {
        if (a.alive) ctx.drawImage(images.alien, a.x, a.y, a.w, a.h);
    });

    ctx.fillStyle = "yellow";
    bullets.forEach(function(b) { ctx.fillRect(b.x, b.y, 3, 10); });
    ctx.fillStyle = "red";
    enemyBullets.forEach(function(eb) { ctx.fillRect(eb.x, eb.y, 4, 12); });

    activeExplosions.forEach(function(ex) {
        ctx.drawImage(images.explosion, ex.x, ex.y, 40, 40);
    });

    if (Game.state === 'VICTORY') {
        renderOverlay("VICTORY!", "#00FF00");
    } else if (Game.state === 'GAMEOVER') {
        renderOverlay("GAME OVER", "#FF0000");
    }
}

function renderOverlay(text, color) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// --- EVENTOS ---
var keys = {};
window.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (e.code === 'Space' && Game.state === 'PLAYING') {
        if (Game.energy >= 1) {
            bullets.push({ x: player.x + player.w / 2, y: player.y });
            Game.energy -= 1;
            document.getElementById('snd-laser').cloneNode(true).play();
        }
    }
});
window.addEventListener('keyup', function(e) { keys[e.code] = false; });

function endGame(result) {
    Game.state = result;
    if (result === 'VICTORY') document.getElementById('snd-victory').play();
    else document.getElementById('snd-gameover').play();
}

function mainLoop() {
    update();
    draw();
    requestAnimationFrame(mainLoop);
}

initFleet();
mainLoop();