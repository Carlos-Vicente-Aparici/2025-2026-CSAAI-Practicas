/*jshint esversion: 6 */

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 700;

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
        if (Game.state === 'LOADING') {
            Game.state = 'PLAYING';
            initFleet();
            requestAnimationFrame(mainLoop);
        }
    }
}

images.player.onload = checkAllLoaded;
images.player.onerror = checkAllLoaded;
images.alien.onload = checkAllLoaded;
images.alien.onerror = checkAllLoaded;
images.explosion.onload = checkAllLoaded;
images.explosion.onerror = checkAllLoaded;

images.player.src = 'NAVE.png'; 
images.alien.src = '—Pngtree—cat in alien spacecraft_18774502.png';
images.explosion.src = 'realistic-fire-explosion-isolated.png';

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

function initFleet() {
    aliens = []; 
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 8; j++) {
            aliens.push({
                x: 150 + j * 75,
                y: 100 + i * 60,
                w: 45,
                h: 35,
                alive: true
            });
        }
    }
}

function update() {
    if (Game.state !== 'PLAYING') return;

    if (keys.ArrowLeft && player.x > 10) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.w - 10) player.x += player.speed;

    if (Game.energy < Game.maxEnergy) Game.energy += 0.02;

    var i, j, a, b, eb, ex;
    var aliveAliens = [];
    for (i = 0; i < aliens.length; i++) {
        if (aliens[i].alive) aliveAliens.push(aliens[i]);
    }

    if (aliveAliens.length === 0) {
        endGame('VICTORY');
        return;
    }

    var speedFactor = 1 + (24 - aliveAliens.length) * 0.15;
    var moveX = Game.fleetDirection * Game.fleetSpeed * speedFactor;
    var hitWall = false;

    for (i = 0; i < aliens.length; i++) {
        a = aliens[i];
        if (a.alive) {
            a.x += moveX;
            if (a.x > canvas.width - a.w - 10 || a.x < 10) hitWall = true;
        }
    }

    if (hitWall) {
        Game.fleetDirection *= -1;
        for (i = 0; i < aliens.length; i++) {
            aliens[i].y += 10;
        }
    }

    var now = Date.now();
    if (now - Game.lastEnemyShootTime > 1200) {
        var shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        enemyBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h });
        Game.lastEnemyShootTime = now;
    }

    for (i = bullets.length - 1; i >= 0; i--) {
        b = bullets[i];
        b.y -= 7;
        for (j = 0; j < aliens.length; j++) {
            a = aliens[j];
            if (a.alive && b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
                a.alive = false;
                bullets.splice(i, 1);
                Game.score += 10;
                activeExplosions.push({ x: a.x, y: a.y, timer: Game.explosionFrames });
                safePlaySound('snd-explosion');
                break;
            }
        }
        if (bullets[i] && bullets[i].y < 0) bullets.splice(i, 1);
    }

    for (i = enemyBullets.length - 1; i >= 0; i--) {
        eb = enemyBullets[i];
        eb.y += 5;
        if (eb.x > player.x && eb.x < player.x + player.w && eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(i, 1);
            Game.lives--;
            if (Game.lives <= 0) endGame('GAMEOVER');
        } else if (eb.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }

    for (i = activeExplosions.length - 1; i >= 0; i--) {
        ex = activeExplosions[i];
        ex.timer--;
        if (ex.timer <= 0) activeExplosions.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Game.state === 'LOADING') {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INICIANDO SISTEMAS...", canvas.width/2, canvas.height/2);
        return;
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Puntuación: " + Game.score, 20, 40);
    ctx.fillText("Vidas: " + Game.lives, canvas.width - 120, 40);
    
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 55, 100, 10);
    ctx.fillStyle = Game.energy < 2 ? "red" : "cyan";
    ctx.fillRect(20, 55, Game.energy * 10, 10);

    if (images.player.complete && images.player.naturalWidth !== 0) {
        ctx.drawImage(images.player, player.x, player.y, player.w, player.h);
    } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    for (var i = 0; i < aliens.length; i++) {
        var a = aliens[i];
        if (a.alive) {
            if (images.alien.complete && images.alien.naturalWidth !== 0) {
                ctx.drawImage(images.alien, a.x, a.y, a.w, a.h);
            } else {
                ctx.fillStyle = "green";
                ctx.fillRect(a.x, a.y, a.w, a.h);
            }
        }
    }

    ctx.fillStyle = "yellow";
    for (var k = 0; k < bullets.length; k++) {
        ctx.fillRect(bullets[k].x - 1, bullets[k].y, 3, 10);
    }

    ctx.fillStyle = "red";
    for (var m = 0; m < enemyBullets.length; m++) {
        ctx.fillRect(enemyBullets[m].x - 2, enemyBullets[m].y, 4, 12);
    }

    for (var n = 0; n < activeExplosions.length; n++) {
        ctx.drawImage(images.explosion, activeExplosions[n].x, activeExplosions[n].y, 40, 40);
    }

    if (Game.state === 'VICTORY') renderOverlay("VICTORY!", "#00FF00");
    else if (Game.state === 'GAMEOVER') renderOverlay("GAME OVER", "#FF0000");
}

function renderOverlay(text, color) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width/2, canvas.height/2);
}

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
    if (Game.state !== 'LOADING') {
        requestAnimationFrame(mainLoop);
    }
}

setTimeout(function() {
    if (Game.state === 'LOADING') {
        Game.state = 'PLAYING';
        initFleet();
        requestAnimationFrame(mainLoop);
    }
}, 2000);