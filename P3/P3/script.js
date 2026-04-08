/*jshint esversion: 6 */

/**
 * INVASIÓN ALIENÍGENA - CANVA CENTAURI
 * Código corregido para validadores y rutas locales
 */

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
    state: 'LOADING', 
    fleetDirection: 1,
    fleetSpeed: 1,
    lastEnemyShootTime: 0,
    explosionFrames: 15
};

// --- RECURSOS (Imágenes con tus rutas específicas) ---
var images = {
    player: new Image(),
    alien: new Image(),
    explosion: new Image()
};

var imagesToLoad = 3;
var imagesLoaded = 0;

function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded >= imagesToLoad) {
        Game.state = 'PLAYING';
    }
}

// Configurar carga
images.player.onload = checkAllLoaded;
images.player.onerror = checkAllLoaded;
images.alien.onload = checkAllLoaded;
images.alien.onerror = checkAllLoaded;
images.explosion.onload = checkAllLoaded;
images.explosion.onerror = checkAllLoaded;

// Tus rutas de sistema
images.player.src = 'spaceship-alien-galaxy-fleet-free-png.png'; 
images.alien.src = '—Pngtree—cat in alien spacecraft_18774502.png';
images.explosion.src = 'realistic-fire-explosion-isolated.png';

// --- ENTIDADES ---
var player = {
    x: 425,
    y: 630,
    w: 50,
    h: 40,
    speed: 6
};

var bullets = [];
var enemyBullets = [];
var aliens = [];
var activeExplosions = [];
var keys = {};

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

    // Movimiento Jugador (Notación de punto para JSHint)
    if (keys.ArrowLeft && player.x > 10) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.w - 10) player.x += player.speed;

    // Energía
    if (Game.energy < Game.maxEnergy) Game.energy += 0.02;

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
        enemyBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h });
        Game.lastEnemyShootTime = now;
    }

    // Colisiones Balas
    for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i];
        b.y -= 7;
        aliens.forEach(function(a) {
            if (a.alive && b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
                a.alive = false;
                bullets.splice(i, 1);
                Game.score += 10;
                activeExplosions.push({ x: a.x, y: a.y, timer: Game.explosionFrames });
                safePlaySound('snd-explosion');
            }
        });
        if (b && b.y < 0) bullets.splice(i, 1);
    }

    // Balas Enemigas
    for (var j = enemyBullets.length - 1; j >= 0; j--) {
        var eb = enemyBullets[j];
        eb.y += 5;
        if (eb.x > player.x && eb.x < player.x + player.w && eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(j, 1);
            Game.lives--;
            if (Game.lives <= 0) endGame('GAMEOVER');
        }
        if (eb && eb.y > canvas.height) enemyBullets.splice(j, 1);
    }

    activeExplosions.forEach(function(ex, idx) {
        ex.timer--;
        if (ex.timer <= 0) activeExplosions.splice(idx, 1);
    });
}

// --- DIBUJADO ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Game.state === 'LOADING') {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CARGANDO...", canvas.width/2, canvas.height/2);
        return;
    }

    // HUD (Sin template literals para JSHint)
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + Game.score, 20, 40);
    ctx.fillText("Vidas: " + Game.lives, canvas.width - 120, 40);
    
    // Barra de Energía
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 55, 100, 10);
    ctx.fillStyle = Game.energy < 2 ? "red" : "cyan";
    ctx.fillRect(20, 55, Game.energy * 10, 10);

    // Dibujar Jugador
    if (images.player.complete && images.player.naturalWidth !== 0) {
        ctx.drawImage(images.player, player.x, player.y, player.w, player.h);
    } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // Dibujar Aliens
    aliens.forEach(function(a) {
        if (a.alive) {
            if (images.alien.complete && images.alien.naturalWidth !== 0) {
                ctx.drawImage(images.alien, a.x, a.y, a.w, a.h);
            } else {
                ctx.fillStyle = "green";
                ctx.fillRect(a.x, a.y, a.w, a.h);
            }
        }
    });

    // Balas
    ctx.fillStyle = "yellow";
    bullets.forEach(function(b) { ctx.fillRect(b.x, b.y, 3, 10); });
    ctx.fillStyle = "red";
    enemyBullets.forEach(function(eb) { ctx.fillRect(eb.x, eb.y, 4, 12); });

    // Explosiones
    activeExplosions.forEach(function(ex) {
        ctx.drawImage(images.explosion, ex.x, ex.y, 40, 40);
    });

    if (Game.state === 'VICTORY') renderOverlay("VICTORY!", "#00FF00");
    else if (Game.state === 'GAMEOVER') renderOverlay("GAME OVER", "#FF0000");
}

function renderOverlay(text, color) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width/2, canvas.height/2);
}

// --- EVENTOS Y UTILIDADES ---
window.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (e.code === 'Space' && Game.state === 'PLAYING') {
        if (Game.energy >= 1) {
            bullets.push({ x: player.x + player.w/2, y: player.y });
            Game.energy -= 1;
            safePlaySound('snd-laser', true);
        }
    }
});
window.addEventListener('keyup', function(e) { keys[e.code] = false; });

function safePlaySound(id, clone) {
    var s = document.getElementById(id);
    if (s) {
        if (clone) s.cloneNode(true).play();
        else s.play();
    }
}

function endGame(result) {
    Game.state = result;
    if (result === 'VICTORY') safePlaySound('snd-victory');
    else safePlaySound('snd-gameover');
}

function mainLoop() {
    update();
    draw();
    requestAnimationFrame(mainLoop);
}

// Arrancar
initFleet();
mainLoop();