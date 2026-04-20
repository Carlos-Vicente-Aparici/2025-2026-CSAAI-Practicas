const config = {
    secuencias: {
        "cama-casa": ["Cama", "Cama", "Cama", "Cama", "Casa", "Casa", "Casa", "Casa"],
        "pato-gato": ["Pato", "Gato", "Pato", "Gato", "Pato", "Gato", "Pato", "Gato"],
        "cerdo-cero": ["Cerdo", "Cerdo", "Cero", "Cero", "Cerdo", "Cerdo", "Cero", "Cero"]
    },
    velocidades: [1000, 800, 600, 450, 300] 
};

let estado = {
    nivelActual: 1,
    posicion: 0,
    intervalo: null,
    tiempo: 0,
    timerGlobal: null,
    musicaOn: false
};

// Referencias a los elementos
const grid = document.getElementById('grid-juego');
const btnInicio = document.getElementById('btn-inicio');
const btnDetener = document.getElementById('btn-detener');
const btnMusica = document.getElementById('btn-musica');
const musicaStatus = document.getElementById('musica-status');
const displayNivel = document.getElementById('display-nivel');
const displayTiempo = document.getElementById('display-tiempo');
const displayEstado = document.getElementById('display-estado');
const displayPalabra = document.getElementById('palabra-principal');
const audioFondo = document.getElementById('audio-fondo');
const audioCuenta = document.getElementById('audio-cuenta');

function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    const seqKey = document.getElementById('select-secuencia').value;
    const items = config.secuencias[seqKey];
    
    items.forEach((label, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        // BUSCA LOS ARCHIVOS DIRECTAMENTE (EJ: cama.png)
        card.innerHTML = `
            <img src="${label.toLowerCase()}.png" onerror="this.src='https://via.placeholder.com/80?text=${label}'">
            <div style="margin-top:5px; font-size:12px; font-weight: bold;">${label.toUpperCase()}</div>
        `;
        grid.appendChild(card);
    });
}

function ejecutarNivel() {
    if (estado.nivelActual > 5) {
        finalizarJuego();
        return;
    }
    
    estado.posicion = 0;
    displayNivel.innerText = estado.nivelActual + "/5";
    displayEstado.innerText = "PREPÁRATE";
    displayPalabra.innerText = "1, 2, 3...";
    
    audioCuenta.play().catch(() => {});

    setTimeout(() => {
        displayEstado.innerText = "¡DILO!";
        const seqKey = document.getElementById('select-secuencia').value;
        const patron = config.secuencias[seqKey];
        const vel = config.velocidades[estado.nivelActual - 1];

        estado.intervalo = setInterval(() => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
            
            if (estado.posicion < 8) {
                const act = document.getElementById("card-" + estado.posicion);
                if (act) act.classList.add('active');
                displayPalabra.innerText = patron[estado.posicion].toUpperCase();
                estado.posicion++;
            } else {
                clearInterval(estado.intervalo);
                estado.nivelActual++;
                setTimeout(ejecutarNivel, 1200);
            }
        }, vel);
    }, 2000);
}

function finalizarJuego() {
    clearInterval(estado.intervalo);
    clearInterval(estado.timerGlobal);
    audioFondo.pause();
    displayPalabra.innerText = "¡TERMINADO!";
    toggleControls(false);
}

function toggleControls(disable) {
    document.getElementById('select-secuencia').disabled = disable;
    document.getElementById('select-nivel').disabled = disable;
    btnInicio.disabled = disable;
    btnDetener.disabled = !disable;
}

// EVENTOS DE LOS BOTONES
btnMusica.onclick = function() {
    estado.musicaOn = !estado.musicaOn;
    musicaStatus.innerText = estado.musicaOn ? "ON" : "OFF";
    console.log("Música cambiada a: " + estado.musicaOn);
};

btnInicio.onclick = function() {
    console.log("Iniciando partida...");
    if(estado.musicaOn) audioFondo.play().catch(() => {});
    
    estado.nivelActual = parseInt(document.getElementById('select-nivel').value);
    estado.tiempo = 0;
    toggleControls(true);
    
    estado.timerGlobal = setInterval(() => {
        estado.tiempo += 0.1;
        displayTiempo.innerText = estado.tiempo.toFixed(1) + 's';
    }, 100);

    ejecutarNivel();
};

btnDetener.onclick = function() {
    location.reload(); // Forma más rápida de resetear todo si algo falla
};

document.getElementById('select-secuencia').onchange = renderGrid;

// Arrancar la cuadrícula al cargar
window.onload = renderGrid;