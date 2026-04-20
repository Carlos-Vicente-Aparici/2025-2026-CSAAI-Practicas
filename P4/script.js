const config = {
    secuencias: {
        "cama-casa": ["Cama", "Cama", "Cama", "Cama", "Casa", "Casa", "Casa", "Casa"],
        "pato-gato": ["Pato", "Gato", "Pato", "Gato", "Pato", "Gato", "Pato", "Gato"],
        "cerdo-cero": ["Cerdo", "Cerdo", "Cero", "Cero", "Cerdo", "Cerdo", "Cero", "Cero"]
    },
    // VELOCIDADES EXTREMAS (en milisegundos)
    // Nivel 1 es rápido, Nivel 5 es casi imposible
    velocidades: [450, 350, 250, 200, 150] 
};

let estado = {
    nivelActual: 1,
    posicion: 0,
    intervalo: null,
    tiempo: 0,
    timerGlobal: null,
    musicaOn: false // Control de estado para el botón
};

// Referencias a los elementos del HTML
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

// Función para dibujar los cuadros
function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    const seqKey = document.getElementById('select-secuencia').value;
    const items = config.secuencias[seqKey];
    
    items.forEach((label, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        // Carga la imagen directamente de la carpeta raíz
        card.innerHTML = `
            <img src="${label.toLowerCase()}.png" onerror="this.src='https://via.placeholder.com/80?text=${label}'">
            <div style="margin-top:5px; font-size:12px; font-weight: bold;">${label.toUpperCase()}</div>
        `;
        grid.appendChild(card);
    });
}

// Lógica de cada nivel
function ejecutarNivel() {
    if (estado.nivelActual > 5) {
        finalizarJuego();
        return;
    }
    
    estado.posicion = 0;
    displayNivel.innerText = estado.nivelActual + "/5";
    displayEstado.innerText = "PREPÁRATE";
    displayPalabra.innerText = "1, 2, 3...";
    
    // Suena "cuenta.mp3" solo si el archivo existe
    audioCuenta.play().catch(() => {});

    setTimeout(() => {
        displayEstado.innerText = "¡DILO!";
        const seqKey = document.getElementById('select-secuencia').value;
        const patron = config.secuencias[seqKey];
        const vel = config.velocidades[estado.nivelActual - 1];

        estado.intervalo = setInterval(() => {
            // Quitamos el brillo a todos
            document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
            
            if (estado.posicion < 8) {
                const act = document.getElementById("card-" + estado.posicion);
                if (act) act.classList.add('active');
                displayPalabra.innerText = patron[estado.posicion].toUpperCase();
                estado.posicion++;
            } else {
                // Fin de la vuelta de 8 cuadros
                clearInterval(estado.intervalo);
                estado.nivelActual++;
                // Pausa corta antes del siguiente nivel para no perder el ritmo
                setTimeout(ejecutarNivel, 1000);
            }
        }, vel);
    }, 1800); // Duración de la preparación
}

// BOTÓN MÚSICA: Solución al problema de ON/OFF
btnMusica.onclick = function() {
    estado.musicaOn = !estado.musicaOn;
    musicaStatus.innerText = estado.musicaOn ? "ON" : "OFF";
    
    if (estado.musicaOn) {
        audioFondo.play().catch(() => console.log("Audio esperando clic"));
    } else {
        // Pausa inmediata y reseteo
        audioFondo.pause();
        audioFondo.currentTime = 0;
    }
};

// BOTÓN INICIO
btnInicio.onclick = function() {
    // Solo suena si el botón está en ON
    if (estado.musicaOn) {
        audioFondo.play().catch(() => {});
    } else {
        audioFondo.pause();
    }
    
    estado.nivelActual = parseInt(document.getElementById('select-nivel').value);
    estado.tiempo = 0;
    toggleControls(true);
    
    // Cronómetro de la partida
    estado.timerGlobal = setInterval(() => {
        estado.tiempo += 0.1;
        displayTiempo.innerText = estado.tiempo.toFixed(1) + 's';
    }, 100);

    ejecutarNivel();
};

// BOTÓN DETENER: Recarga la página para limpiar todo rastro de audio y timers
btnDetener.onclick = function() {
    location.reload();
};

function finalizarJuego() {
    clearInterval(estado.intervalo);
    clearInterval(estado.timerGlobal);
    audioFondo.pause();
    displayPalabra.innerText = "¡TERMINADO!";
    displayEstado.innerText = "FIN";
}

function toggleControls(disable) {
    document.getElementById('select-secuencia').disabled = disable;
    document.getElementById('select-nivel').disabled = disable;
    btnInicio.disabled = disable;
    btnDetener.disabled = !disable;
}

// Actualiza la cuadrícula si cambias la selección en el menú
document.getElementById('select-secuencia').onchange = renderGrid;

// Inicia la cuadrícula visual nada más cargar la página
window.onload = renderGrid;